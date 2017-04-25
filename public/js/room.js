var socket = io();
var roomId = '';
var matched = location.href.match(/\/room\/(\d+)/);
roomId = matched ? matched[1] : '';

function User(opt) {
  var user = this;
  var _default = {
    id: '',
    color: 'red',
    position: 0,
    width: 48,
    height: 48,
    runPosition: {x: 0, y: 0},
    userAvatar: '',
    speed: 0,
    tempDis: 0,
    distance: 0,
    time: 0,
    n: 0
  }
  console.log(opt);
  opt = $.extend(_default, opt);
  this.id = opt.id;
  this.color = opt.color;
  this.n = opt.n;
  this.position = opt.position;
  this.runPosition = opt.runPosition;
  this.width = opt.width;
  this.height = opt.height;
  this.userAvatar = opt.userAvatar;
  this.speed = opt.speed;
  this.tempDis = opt.tempDis;
  this.distance = opt.distance;
  this.time = opt.time;
  var $item = $('#J_wrap').find('li');
  var a = 7;
  var len = $item.length;
  var b = Math.ceil(len / a);
  this.avaMove = function(dir) {
    if (dir == 'right') {
      console.log('move right');
      var _origin = user.n;
      console.log('right:' + user.n);
      if (user.n === (len - 1)) {
        user.n = 0;
      }else {
        user.n++;
      }
    }
    if (dir == 'left') {
      var _origin = user.n;
      if (user.n == 0) {
        user.n = (len - 1);
      }else {
        user.n--;
      }
    }
    if (dir == 'up') {
      var _origin = user.n;
      var _row = Math.ceil((user.n + 1) / a);
      if (_row < 2) {
        user.n += a * (b - 1);
      }else {
        user.n = _origin - a;
      }
    }

    if (dir == 'down') {
      var _origin = user.n;
      var _row = Math.ceil(( user.n + 1 ) / a);
      if (_row >= b) {
        user.n -= a * (b - 1);
      }else {
        user.n = _origin + a;
      }
    }

    console.log('user.n:' + user.n + ' _origin: ' + _origin + ' dir: ' + dir);
    this.changeAvatar(user.n, _origin, user.color, user.id);
  }

  this.changeAvatar = function(position, origin, color, id) {
    console.log(origin);
    $item.eq(origin).removeClass(color);
    $item.eq(position).addClass(color);
    id = id || '';
    var _userAvatar = (position + 1) + '.png';
    // console.log('######');
    // console.log(_userAvatar);
    // console.log(id + ' roomId: ' + roomId);
    // console.log('######');
    // console.log(position);
    //回传图像
    socket.emit('backfill avatar img', {
      roomId: roomId,
      userId: id,
      userAvatar: _userAvatar
    });
  }
}


var Game = function(opt) {
  var runGame = this;
  var cavW = 1000;
  var cavH = 560;
  this.scale = 8;
  this.players = [];
  this.winners = {
    roomId: roomId,
    result: {}
  };
  this.rank = 0;
  var canvas, stage, loader;
  var manifest = [], runGrunt = [];

  //
  function init() {
    canvas = document.getElementById("run-canvas");
    stage = new createjs.Stage(canvas);

    initPlayer();

    //背景图
    stage.canvas.width = cavW;
    stage.canvas.height = cavH;
    manifest.push({
      src: 'runway.jpg', id: 'runway'
    });
    initManifest();
    loader = new createjs.LoadQueue(false);
    loader.addEventListener("complete", handleComplete);
    loader.loadManifest(manifest, true, '../img/');
  }

  function initPlayer () {
    for (var _i in opt) {
      var _user = opt[_i];
      runGame.players.push({
        id: _user.userId,
        width: 48,
        height: 48,
        runPosition: {x: 0, y: 0},
        userAvatar: _user.userAvatar,
        speed: 0,
        tempDis: 0,
        distance: 0,
        time: 0,
        n: _user.n
      });
    }
  }

  //init
  function initManifest () {
    for (var i in runGame.players) {
      var _player = runGame.players[i];
      manifest.push({
        src: _player.userAvatar, id: 'player' + i
      })
    }

  }

  function handleComplete() {
    sky = new createjs.Shape();

    //跑道
    // var groundImg = loader.getResult("runway");
    // console.log('groundImg.width: ' + groundImg.width + ' groundImg.height:' + groundImg.height);
    // ground = new createjs.Shape();
    // ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, groundImg.width, groundImg.height);
    // ground.y = 0;

    ground = new createjs.Bitmap(loader.getResult("runway"));

    stage.addChild(ground);

    //runer
    initGame(runGame.players);
    //stage.update();
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.addEventListener("tick", tick);
  }

  //init canvas
  function initCanvas () {

    initPlayer(runGame.players);
  }

  //init player
  function initGame(playerArr) {
    for (var i in playerArr) {
      var _player = playerArr[i];
      var y = 185 + (_player.height + 32) * parseInt(i);
      var x = _player.runPosition.x + 70;
      //var grant = null;
      var grant = new createjs.Bitmap(loader.getResult('player' + i));
      // var spriteSheet = new createjs.SpriteSheet({
      //   framerate: 30,
      //   images: [loader.getResult('player' + i)],
      //   frames: {
      //     width: _player.width,
      //     height: _player.height,
      //     count: 1
      //   },
      //   // define two animations, run (loops, 1.5x speed) and jump (returns to run):
      //   animations: {
      //     run: [0, 25]
      //   }
      // });
      // grant = new createjs.Sprite(spriteSheet,'run');
      grant.x = x;
      grant.y = y;
      _player.grunt = grant;
      stage.addChild(grant);
    }

  }

  function tick(event) {
    for (var i in runGame.players) {
      var _player = runGame.players[i];
      var _grunt = _player.grunt;
      var _id = _player.id;
      if (_grunt.x <  cavW - _player.width - 100) {
        var _dis = 0;
        if (_player.distance != 0) {
          _player.tempDis += _player.distance / 30;
          if (_player.tempDis >= _player.distance) {
            _player.distance = 0;
            _player.speed = 0;
            _player.tempDis = 0;
          }
        }
        var x = _grunt.x + _player.speed * runGame.scale;
        var y = _grunt.y;
        _grunt.x = x;
        _grunt.y = y;
      }else {
        //stage.clear();
        var _result = runGame.winners.result;
        if (!_result[_id]) {
          runGame.rank ++;
          _result[_id] = {
            id: _player.id,
            rank: runGame.rank
          };
          _player.rank = runGame.rank
        }
        if (typeof _player.finish == 'undefined' || _player.finish != true) {
          finishGame(_player);
          _player.finish = true;
        }
        //socket.emit('finish game',{})
        if (runGame.rank == runGame.players.length) {
          console.log(runGame.winners);
          gameEnd();
          socket.emit('end game', runGame.winners);
          createjs.Ticker.removeEventListener('tick', tick);
        }
      }
    }
    stage.update(event);
  }

  function finishGame(_player) {
    var _obj = {
      roomId: roomId,
      userId: _player.id
    }
    console.log('finish game=======');
    console.log(_obj);
    console.log('finish game=======');
    socket.emit('finish game', _obj);
  }

  //游戏结束
  function gameEnd() {
    $('.game-main').addClass('hide');
    $('.J_result').removeClass('hide');
    var html = '';
    for (var i in runGame.players) {
      var _player = runGame.players[i];
      html += '<p class="rank rank' + _player.rank +'"><img src="../img/' + _player.userAvatar + '" />userId:' + _player.id + '</p>';
    }
    $('.J_result').find('.result-con').html(html);
    console.log(runGame.players);
  }

  //更新
  function changeSpeed(opt) {
    var _distance = opt.distance * 200;
    var _speed = _distance / opt.time;
    var _obj = runGame.players[getUserIndexById(opt.id)];
    _obj.speed = _speed;
    _obj.distance = _distance * 500;
    _obj.time = opt.time
  }

  //
  function drawUser(player) {
    var _pos = player.runPosition;
    cxt.fillStyle = '#FF6600';
    cxt.fillRect(_pos.x, _pos.y, 40, 40);

    // var _img = new Image();
    // _img.onload = function() {
    //   cxt.drawImage(_img, _pos.x, _pos.y, player.width, player.height);
    // }
    // _img.src = '../img/' + player.userAvatar;
  }

  //根据用户id 得到用户
  function getUserIndexById(uid) {
    for(var i in runGame.players) {
      if (runGame.players[i].id == uid) {
        //console.log()
        return i;
      }
    }
    return 0;
  }

  init();

  return {
    changeSpeed: changeSpeed
  }
}

var Utils = {
  getUserIndexById: function() {

  }
}

$(function () {
  var userIdArr = [];
  var users = 0;

  var player = [];
  var color = ['red', 'blue', 'yellow', 'orange'];
  var usersObj = [];
  var gameObj = null;
  socket.emit('open room', roomId);
  socket.on('enter room', function (data) {
    console.log(data);
    if (roomId == data.roomId) {
      if (userIdArr.length < 4) {
        for (value of userIdArr) {
          if (value === data.userId) {
            return;
          }
        }
        player[users] = new User({
          id: data.userId,
          color: color[users],
          n: users,
        });
        // player[users] = setPhone({
        //   id: data.userId,
        //   color: color[users],
        //   num: 0,
        // });
        users++;

        $('.box_link .mobile:lt(' + users + ')').addClass('link');
        changeClass($('.box_link .mobile').eq(users - 1));
        userIdArr.push(data.userId);
      }
    }
  });

  socket.on('select avatar', function (data) {
    console.log('select avatar');
    if (roomId == data.roomId) {
      $('.box_link').addClass('hide');
      $('.box_head').removeClass('hide');
    }
    //初始化样式
    initAvatarClass(player);
  });

  var changeClass = function ($obj) {
    $obj.addClass('getin');
    setTimeout(function () {
        $obj.removeClass('getin');
      }, 5000);
  };

  //初始化选中

  var $item = $('#J_wrap').find('li');
  var set = function (n, color) {
    //$item.removeClass('active').removeClass('red yellow blue orange').eq(n).addClass('active').addClass(color);
  };

  var a = 7;
  var b = parseInt($item.length / a);

  socket.on('move selection box', function (data) {
    console.log('move selection box');
    if (roomId == data.roomId) {
      var _userId = data.userId;
      console.log(_userId);
      console.log(userIdArr);
      var _index = getUserIndexById(_userId);
      var _player = player[_index];
      console.log('position: ' + data.position);
      _player.avaMove(data.position);
    }
  });

  socket.on('start game', function (data) {
    console.log('start game');
    console.log(data);
    console.log('start game end');
    $('.avatar-con').addClass('hide');
    $('.game-main').removeClass('hide');

    startGame(data);
  });

  socket.on('step game', function(data) {
    // console.log('step game');
    // console.log(data);
    // console.log('step game end');
    gameObj.changeSpeed({
      id: data.userId,
      distance: data.distance,
      time: data.time
    })
  });

  function startGame(data) {

    //生成测试数据
    var testPlayer = [];
    for (var i = 0; i < 3; i++) {
      var _random = parseInt(Math.random() * 10) + 1;
      var _player = {
        id: '0987' + i,
        width: 48,
        height: 48,
        runPosition: {x: 0, y: 0},
        userAvatar: _random + '.png',
        speed: 0,
        tempDis: 0,
        distance: 0,
        time: 0
      }
      testPlayer.push(_player);
    }
    //console.log(player);
    gameObj = new Game(data.users);
  }

  //初始化 头像选择样式
  function initAvatarClass(playersObj) {

    playersObj = playersObj || {};
    var $item = $('#J_wrap').find('li');
    for(var i in playersObj) {
      var _player = playersObj[i];
      $item.eq(_player.n).addClass(_player.color);
    }
  }

  //修改样式
  var $item = $('#J_wrap').find('li');

  function changeAvatar(position, origin, color, id) {
    console.log(origin);
    $item.eq(origin).removeClass(color);
    $item.eq(position).addClass(color);
    id = id || '';
    var _userAvatar = (position + 1) + '.png';
    // console.log('######');
    // console.log(_userAvatar);
    // console.log(id + ' roomId: ' + roomId);
    // console.log('######');
    // console.log(position);
    //回传图像
    socket.emit('backfill avatar img', {
      roomId: roomId,
      userId: id,
      userAvatar: _userAvatar
    });
  }

  //根据用户id 得到用户
  function getUserIndexById(uid) {
    for(var i in userIdArr) {
      console.log(userIdArr[i] === uid);
      if (userIdArr[i] == uid) {
        //console.log()
        return i;
      }
    }
    return 0;
  }

});
