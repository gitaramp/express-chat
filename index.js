var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// let hours = new Date().getHours(),
//       minutes = new Date().getMinutes(),
//       seconds = new Date().getSeconds();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  io.emit('chat message', sendFullMessage('Ktoś dołączył do chatu!'), 'server');

  socket.on('chat message', function(msg){
    console.log(sendFullMessage(msg));
    io.emit('chat message', sendFullMessage(msg));
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

const sendFullMessage = (msg) => {
  let hours = new Date().getHours(),
      minutes = new Date().getMinutes(),
      seconds = new Date().getSeconds();
  return `[${hours<10 ? '0' + hours : hours}:${minutes<10 ? '0' + minutes: minutes}:${seconds<10 ? '0' + seconds : seconds}] ${msg}`;
};