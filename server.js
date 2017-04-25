const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var ip = require('ip').address();
var QRCode = require('qrcode');


const avatars = require('./app/avatar.js');

var room = {};
var users = [];
var users = {};
var connections = [];


app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');
app.use(express.static('public'));

//app.get('/', function(req, res) {
//res.sendFile(path.join(__dirname, 'app/views/index.html'));
//});

app.get('/', function(req, res) {
  res.render('index', {
    title: 'Running game',
    href: `/room/${parseInt(Math.random() * 1000000, 10)}`,
  });
});

app.get('/room/:id', function(req, res) {
  let id = req.params.id;
  let enterUrl = `http://${ip}:3000/room/${id}/enter`;

  QRCode.toDataURL(enterUrl, function(err, url) {
    url = url || 'http://img6.bdstatic.com/img/image/smallpic/h7.jpg';
    res.render('room', {
      title: `当前房间：${id}`,
      message: 'Hello there!',
      enterUrl: enterUrl,
      qrCode: url,
    })
  })

  // res.render('room', {
  //   title: `当前房间：${id}`,
  //   message: 'Hello there!'
  // })
});

app.get('/room/:id/enter', function(req, res) {
  let id = req.params.id;
  res.redirect(`/room/${id}/player/${parseInt(Math.random() * 1000000, 10)}`);
});

app.get('/room/:roomId/player/:playerId', function(req, res) {
  let roomId = req.params.roomId;
  res.render('player', {
    title: `当前房间：${roomId}`,
    message: 'Hello there!'
  })
});

//app.get('/room/:id/game', function(req, res) {
//let id = req.params.id;
//res.render('game', {
//title: `当前房间：${id}`,
//message: 'Hello there!'
//})
//});

io.on('connection', function(socket) {
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  socket.on('open room', function(id) {
    socket.join('screen' + id);
    console.log('open room');
    socket.roomId = id;
    if (!room[id]) {
      room[id] = {
        userIds: [],
        confirms: [], // 以确定的人数
        finish: [], // 结束的用户
      };
    }
  });

  socket.on('enter room', function(data, callback) {
    let roomId = data.roomId;
    let userId = data.userId;
    console.log('enter room');

    if (room[roomId]) {
      let showAllPlayers = room[roomId].userIds.length == 0 ? true : false;
      if (room[roomId].userIds.length < 4) {
        socket.roomId = roomId;
        socket.userId = userId;
        socket.join('u' + data.userId);
        socket.join('r' + data.roomId);
        room[roomId].userIds.push(userId);
        callback && callback({
          code: 0,
          data: {
            showAllPlayers: showAllPlayers
          }
        });
        io.to('r' + data.roomId).emit('enter room', data);
        io.to('screen' + data.roomId).emit('enter room', data);
      } else {
        callback && callback({ code: -1 });
      }
    } else {
      io.to('r' + data.roomId).emit('close room', roomId);
    }

  });

  socket.on('select avatar', function(roomId, callback) {
    // socket.join('r' + roomId);
    console.log('select avatar');
    callback(avatars);
    if (!room[roomId]) {
      return;
    }

    io.to('screen' + roomId).emit('select avatar', {
      roomId: roomId,
      userIds: room[roomId].userIds,
      avatars: avatars
    });
    room[roomId].userIds.forEach(function(item,index) {
      io.to('u' + item).emit('start chosse avatar',{
         roomId: roomId,
         userID: item,
         avatar: avatars[index],
      });
    });
  });

  socket.on('move selection box', function(data) {
    console.log('move selection box');
    // socket.join('u' + data.userId);
    io.to('screen' + data.roomId).emit('move selection box', {
      roomId: data.roomId,
      position: data.position,
      userId: data.userId
    });
  });

  // 回填头像
  socket.on('backfill avatar img', function(data) {
    console.log('backfill avatar img');
    // socket.join('u' + data.userId);
    io.to('u' + data.userId).emit('backfill avatar img', {
      roomId: data.roomId,
      userId: data.userId,
      userAvatar: data.userAvatar,
    });
  });

  // 确定选择头像
  socket.on('confirm avatar', function(data, cb) {
    console.log('confirm avatar');
    // socket.join('u' + data.userId);
    let first = false;
    if(!room[data.roomId]) return;
    
    if(!users[data.roomId]) {
      users[data.roomId] = [];
    }
    users[data.roomId].push({
      userId: data.userId,
      userAvatar: data.userAvatar,
    }); 
    if (room[data.roomId].confirms.length == 0) {
      first = true;
    }

    room[data.roomId].confirms.push(data.userId);
    cb && cb({
      code: 0,
      data: {
        showStartGame: first,
      }
    });
  });

  // 开始游戏
  socket.on('start game', function(roomId, cb) {
    console.log('start game');
    // socket.join('r' + roomId);
    let all = false;
    if(!room[roomId] ) return;
    if (room[roomId].confirms.length == room[roomId].userIds.length) {
      all = true;
    }
    if (all) {
      io.to('r' + roomId).emit('start game', roomId);
      io.to('screen'+roomId).emit('start game', {users:users[roomId]});
    } else {
      cb && cb({
        code: -1,
        msg: '还有玩家未确定',
      });
    }
  });

  // 玩游戏
  socket.on('step game', function(data) {
    let roomId = data.roomId,
      userId = data.userId;
    // socket.join('u' + userId);
    console.log('step game');

    socket.broadcast.to('screen' + roomId).emit('step game', data);
  });

  // 到达终点
  socket.on('finish game', function(data) {
    let roomId = parseInt(data.roomId, 10),
      userId = parseInt(data.userId, 10);

    if(!roomId || !userId || !room[roomId]) return;
    console.log('finish game');
    if(room[roomId]&&room[roomId].finish.indexOf(userId)<=0){
      room[roomId].finish.push(userId);
    }
    io.to('u' + userId).emit('finish game',  room[roomId].finish);
  });

  // 结束游戏
  socket.on('end game',function(data){
    console.log('end game' + data);
    io.to('r' + data.roomId).emit('end game', data);
  });

  socket.on('disconnect', function(data) {
    if (socket.roomId && !socket.userId) {
      delete room[socket.roomId];
      delete room[socket.userId];
      delete users[socket.roomId];
      io.to('r' + socket.roomId).emit('close room');
    }else if(socket.roomId && socket.userId){
      delete room[socket.roomId];
      delete room[socket.userId];
      if(users[socket.roomId]) {
        for(let i =0; i<users[socket.roomId].length; i++) {
          if(users[socket.roomId][i] == socket.userId) {
            users[socket.roomId].splice(i, 1);
            break;
          }
        }
      }
      io.to('screen' + socket.roomId).emit('close room');
    }

    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });

});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
