const express = require('express'),
      app = express(),
      http = require('http').Server(app),
      io = require('socket.io')(http),
      Cookies = require('cookies'),
      logToFile = require('log-to-file'),
      fileUpload = require('express-fileupload'),
      port = process.env.PORT || 3000,
      logFileName = 'chatLogs.log';

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


app.use(fileUpload({
  limits : { filesize: 50 * 100 * 100 }
}));

app.post('/upload', function(req, res) {
  const file = req.files.ownAvatar;
  const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
  if (validImageTypes.includes(file.mimetype)) {
    // req.files.ownAvatar.md5; //cookie with md5 + add file type
    let type;
    switch(file.mimetype) {
      case 'image/gif' : {
        type = 'gif';
        break;
      }

      case 'image/jpeg' : {
        type = 'jpg';
        break;
      }

      case 'image/png' : {
        type = 'png';
        break;
      }
    }
    const avatarPath = `users_avatars/${file.md5}.${type}` 
    file.mv(`public/${avatarPath}`); 
    io.emit('set avatar', avatarPath); 
  } else io.emit('display alert', 'Niewłaściwy forma pliku!');
  res.status(204).send();
});


io.on('connection', function(socket){
  
  socket.on('user join', function(nickName){
    console.log(sendMessageWithTime(`${nickName} joined to chat`, false, true));
    io.emit('chat message', sendMessageWithTime(`${nickName} dołączył/a do chatu!`), 'join');
  });

  socket.on('chat message', function(msg, nick, colorNick, avatar){
    console.log(sendFullMessage(msg, nick, true));
    io.emit('chat message', sendFullMessage(msg, nick, false, colorNick, avatar));
  });

  socket.on('disconnect', function() {
    console.log(sendMessageWithTime(`someone leaved chat`, false, true));
    io.emit('chat message', sendFullMessage('Ktoś się rozłączył!'), 'leave');
 });
});

http.listen(port, function(){
  console.log('Server started! Listening on *:' + port);
});

const actualDate = () => {
  let hours = new Date().getHours(),
      minutes = new Date().getMinutes(),
      seconds = new Date().getSeconds(),
      date = `[${hours<10 ? '0' + hours : hours}:${minutes<10 ? '0' + minutes: minutes}:${seconds<10 ? '0' + seconds : seconds}]`;
  
  return date;
}

const sendMessageWithTime = (msg, space=true, logFile=false) => {
  let date = actualDate(),
      fullMsg;
  space ? fullMsg = `${date} ${msg}` : fullMsg = `${date}${msg}`;
  if(logFile) logToFile(fullMsg, logFileName);
  return fullMsg;
}

const sendFullMessage = (msg, nick, consoleLog, colorNick, avatar) => {
  let fullMsg, 
      date = actualDate(),
      userAvatar;
      
  avatar === 'default' ? userAvatar = 'img/default.png' : 
    userAvatar = avatar;

  consoleLog ? fullMsg = `${date}${nick}: ${msg}` : fullMsg = `${date}<figure class='image is-24x24'>
      <img class='user-avatar' src='${userAvatar}' alt=''>
      </figure><span style="color: ${colorNick}">${nick}</span>: ${msg}`;

  if(consoleLog) logToFile(fullMsg, logFileName);
  return fullMsg;
};