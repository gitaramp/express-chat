var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Cookies = require('cookies');
var port = process.env.PORT || 3000;
let lastVisit;

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
  
  var keys = ['keyboard cat'];
  var cookies = new Cookies(req, res, { keys: keys })
  lastVisit = cookies.get('LastVisit', { signed: true })
  cookies.set('LastVisit', new Date().toISOString(), { signed: true })
 
  // if (!lastVisit) {
  //   res.setHeader('Content-Type', 'text/plain')
  //   res.end('Welcome, first time visitor!')
  // } else {
  //   res.setHeader('Content-Type', 'text/plain')
  //   res.end('Welcome back! Nothing much changed since your last visit at ' + lastVisit + '.')
  // }
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