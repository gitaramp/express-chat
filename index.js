const express = require('express'),
      app = express(),
      http = require('http').Server(app),
      io = require('socket.io')(http),
      logToFile = require('log-to-file'),
      fileUpload = require('express-fileupload'),
      port = process.env.PORT || 3000,
      logFileName = 'chatLogs.log',
      sharedsession = require("express-socket.io-session");

const session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true
});

app.use(express.static('public'));
app.use(session);
app.use(fileUpload({
  limits : { filesize: 50 * 100 * 100 }
}));
io.use(sharedsession(session, {
  autoSave:true
}));

io.on('connection', function(socket){
  const Session = socket.handshake.session;
  if (Session.nickName)
    io.emit('load nickName', Session.nickName);
  if (Session.avatar)
    io.emit('load avatar', Session.avatar);
  if (Session.nickColor)
    io.emit('load nickColor', Session.nickColor);

  socket.on('user join', function(nickName){
    Session.nickName = nickName;
    Session.save();
   
    console.log(sendMessageWithTime(`${nickName} joined to chat`, false, true));
    io.emit('chat message', sendMessageWithTime(`${nickName} dołączył/a do chatu!`), 'join');
  });

  socket.on('chat message', function(msg, nick, colorNick, avatar){
    console.log(sendFullMessage(msg, nick, true));
    io.emit('chat message', sendFullMessage(msg, nick, false, colorNick, avatar));
  });

  socket.on('change nickName', function(nickName){
    Session.nickName = nickName;
    Session.save();
  });

  socket.on('change avatar', function(path){
    Session.avatar = path;
    Session.save();
  });

  socket.on('change nickColor', function(color){
    Session.nickColor = color;
    Session.save();
  });

  socket.on('disconnect', function() {
    console.log(sendMessageWithTime(`Someone leaved chat`, false, true));
    io.emit('chat message', sendFullMessage('Ktoś się rozłączył!'), 'leave');
 });
});

http.listen(port, function(){
  console.log('Server started! Listening on *:' + port);
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

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
  } else io.emit('display alert', 'Niewłaściwy format pliku!');
  res.status(204).send();
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