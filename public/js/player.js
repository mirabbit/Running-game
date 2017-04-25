$(function () {
  var socket = io();
  window.socket = socket;
  var roomId = '';
  var userId = '';
  var users = 0;
  var matched = location.href.match(/\/room\/(\d+)\/player\/(\d+)/);
  if (matched) {
    roomId = matched[1] || '';
    userId = matched[2] || '';
  } else {
    roomId = '';
    userId = '';
  }

  var formatSrc = function(src) {
    return '/img/' + src;
  }

  var getRoomAndPlayId = function() {
    var pathArr = location.href.split('/');
    return {
      roomId: pathArr[pathArr.length - 3],
      playerId: pathArr[pathArr.length - 1]
    }
  }

  var roomId = getRoomAndPlayId().roomId.trim();
  var playerId = getRoomAndPlayId().playerId.trim();
  console.log(roomId)
  console.log(playerId)

  // loading 消失
  setTimeout(function() {
    $('#loading').hide();
  }, 1000);

  socket.emit('enter room', {
    roomId: roomId,
    userId: playerId,
  },function(data){
    // code -1 房间满了 0 成功： data.showAllPlayers : true
    if(data.code == -1){
      location.href = location.origin;
    } else if(data.code == 0 && data.data.showAllPlayers) {
        $('#ready').css('display', 'block');
    } else {
        $('#ready').css('display', 'none');
        // $('#player').css('display', 'block');
        $('.waiting-info').css('display', 'block');
    }
  });

  // 多人玩游戏 要等待都选完头像 才能开始
  socket.on('start chosse avatar', function(data) {
      if(roomId == data.roomId && playerId == data.userID) {
        $('#part1').css({'display': 'none'});
        $('#part2').css({'display': 'block'});
        $('#avatar').attr('src', data.avatar.src.replace('/avatar', ''));
      }
  });
  // 实时选择头像
  socket.on('backfill avatar img', function(data) {
    console.log('=======');
    console.log(data);
    if(roomId == data.roomId && playerId == data.userId) {
      $('#avatar').attr('src', formatSrc(data.userAvatar));
    }
    console.log('=======');
  });

  socket.on('start game', function(data) {
    console.log('=======');
    console.log(data);
    $('#part2').css('display', 'none');
    $('#part3').css('display', 'block');
    console.log('=======');
  });

  $('#choose-btn').bind('click', function() {
    // console.log($('#avatar').attr('src').replace('/img/', ''));
    socket.emit('confirm avatar', {
      roomId: roomId,
      userId: playerId,
      userAvatar: $('#avatar').attr('src').replace('/img/', '')
    }, function (data, cb) {
        if(data.code == 0) {
          $('#choose-btn').css('display', 'none');
          $('#choose-btn').unbind();
          $('#up').unbind();
          $('#down').unbind();
          $('#left').unbind();
          $('#right').unbind();
          if(data.data.showStartGame) {
            $('#start-btn').css('display', 'block');
            $('#start-btn').bind('click', function(event) {
              socket.emit('start game', roomId, function (data) {
                if(data.code != 0) {
                  alert(data.msg);
                }
              });
            });
          } else {
              $('#waiting-btn').show();
          }
        } else {
          alert(data.msg);
        }
    });
  });

  //开始游侠
  // $('.J_startGame').on('click', function() {
  //   socket.emit('start game', {});
  // })

  $('#ready').bind('click', function () {
    socket.emit('select avatar', roomId, function (data) {
      $('#part1').css({'display': 'none'});
      $('#part2').css({'display': 'block'});
      $('#avatar').attr('src', data[0].src.replace('/avatar', ''));
    });
  });

  $('#up').bind('click', function () {
    socket.emit('move selection box', {
      roomId: roomId,
      userId: userId,
      position: 'up',
    });
  });

  $('#down').bind('click', function () {
    socket.emit('move selection box', {
      roomId: roomId,
      userId: userId,
      position: 'down',
    });
  });

  $('#left').bind('click', function () {
    socket.emit('move selection box', {
      roomId: roomId,
      userId: userId,
      position: 'left',
    });
  });

  $('#right').bind('click', function () {
    socket.emit('move selection box', {
      roomId: roomId,
      userId: userId,
      position: 'right',
    });
  });

  // part3
  document.addEventListener('touchmove', function (ev){
    //ev.preventDefault();
  }, false);
  
  $("#part3").swipe( {
    //Generic swipe handler for all directions
    swipe:function(event, direction, distance, duration, fingerCount, fingerData) {
      var distancePercent = ( distance / parseInt(document.body.clientHeight)).toFixed(5);
      // alert(distancePercent)
      if(direction == 'down') {
        // alert('距离:' + distance + ' 时间:' + duration);
         // 玩游戏
        socket.emit('step game', {
          userId: playerId,
          roomId: roomId,
          distance: distancePercent,
          time: duration
        });
      }
    },
    //Default is 75px, set to 0 for demo so any distance triggers swipe
     threshold:0
  });

  // 到达终点
  socket.on('finish game', function(data) {
    console.log('finish game lg');
    console.log(data);
    console.log('finish game lg en')
    if(data.indexOf(parseInt(playerId)) > -1) {
      var rank = (data.indexOf(parseInt(playerId)) + 1);

      $('#part3').hide();
      $('#part4').show();
      $('#result-avatar').attr('src', $('#avatar').attr('src'));
      $('#rank').html('你获得了第' + rank + '名哦~');
      // alert('你获得了第' + rank + '名哦~');
    }
  });
  // 游戏结束
  socket.on('end game', function(data) {
    if(data.roomId == roomId) {
      console.log(data);
      console.log(data.result[playerId].rank);
      $('#part3').hide();
      $('#part4').show();
      $('#result-avatar').attr('src', $('#avatar').attr('src'));
      $('#rank').html('游戏结束, 你获得了第' + data.result[playerId].rank + '名哦~');
      // $('#rank').html('游戏结束, 你获得了第' + data.result.rank + '名哦~');
    }

  });


});
