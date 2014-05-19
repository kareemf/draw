'use strict';

var express = require('express'),
    app = express();

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

var io = require('socket.io').listen(server);

app.get('/', function index(req, res){
  res.sendfile(__dirname + '/public/canvas.html');
});

io.sockets.on('connection', function (socket) {
  io.sockets.emit('user connected');

  socket.on('message', function (from, data) {
    console.log('message from', from, '. data', data);
    // sending to all clients except sender
    socket.broadcast.emit('message', from, data);
  });

  socket.on('disconnect', function () {
    io.sockets.emit('user disconnected');
  });
});
