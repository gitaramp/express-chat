var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  io.emit('chat message', sendFullMessage('Ktoś dołączył do chatu!'), 'join');

  socket.on('chat message', function(msg){
    console.log(sendFullMessage(msg));
    io.emit('chat message', sendFullMessage(msg));
  });

  socket.on('disconnect', function() {
    io.emit('chat message', sendFullMessage('Ktoś się rozłączył!'), 'leave');
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