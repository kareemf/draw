'use strict';

var express = require('express'),
    redis = require('redis'),
    app = express();

app.use(express.static(__dirname + '/public'));

var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});

var io = require('socket.io').listen(server);

app.get('/', function index(req, res){
    res.sendfile(__dirname + '/public/canvas.html');
});

var redisclient;
if(process.env.REDISCLOUD_URL){
    var url = require('url');
    var redisURL = url.parse(process.env.REDISCLOUD_URL);

    console.log('redis: connected to REDISCLOUD')
    redisclient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
    redisclient.auth(redisURL.auth.split(":")[1]);
}
else{
    console.log('redis: connecting to localhost');
    redisclient = redis.createClient(redisPort, redisHost);
}

redisclient.on("error", function (err) {
    console.log("redis error " + err);
});

var userIdsToSocketIds = {};
var socketIdsToUserIds = {};

//todo: track users in room

io.sockets.on('connection', function (socket) {
    console.log('user connected to socket', socket.id);

    socket.on('roomConnection', function(roomId, user){
        console.log('user', user, 'connected to room', roomId);

        var userId = user.guid;

        userIdsToSocketIds[userId] = socket.id;
        socketIdsToUserIds[socket.id] = userId

        //will only listen to events targeting this room;
        var eventKey = 'message-' + roomId;
        var historyKey = 'messages-' + roomId;
        var mouseEventKey = 'mouse-' + roomId;
        var roomConnectionKey = 'userConnected-' + roomId;
        var roomConnectionHandshakeKey = 'handshakeConnection-' + roomId;
        var roomDisconnectionKey = 'userDisconnected-' + roomId;

        //inform other users that you have joined the room
        socket.broadcast.emit(roomConnectionKey, user);

        //other users will inform you of thier presence in the room
        socket.on(roomConnectionHandshakeKey, function(handshake){
            console.log('handshake:', handshake);

            var socketId = userIdsToSocketIds[handshake.initiator.guid];
            if(socketId){
                io.sockets.socket(socketId).emit(roomConnectionHandshakeKey, handshake);
            }
            else{
                console.log('couldnt find socket id for hand shake with', userId);
            }
        });

        //when user connects, retrieve all previously emitted messages from redis
        //and send to user
        redisclient.lrange(historyKey, 0, -1, function(err, items){
            if(err){
                console.log("error retrieving messages from redis: " + err);
            }
            else{
                socket.emit(historyKey, items);
            }
        });

        //user has emmited an event - add to history and send broad to other users
        socket.on(eventKey, function (data) {
            console.log('message from', data.userId, '. data', data);

            //if screen was cleared, flush history - no longer needed
            if(data.type === 'clear'){
                console.log('clearing REDIS');
                redisclient.del(historyKey);
            }
            //add message to history
            redisclient.rpush(historyKey, JSON.stringify(data));

            // send to all clients except sender
            socket.broadcast.emit(eventKey, data);
        });

        //track mouse movement
        socket.on(mouseEventKey, function (data) {
           socket.broadcast.emit(mouseEventKey, data);
        });

        socket.on('disconnect', function () {
            console.log('user disconnected from', socket.id);

            // find the user belonging to this socket,
            var userId = socketIdsToUserIds[socket.id];
            if(!userId){
                return console.error('unable to find user belonging to socket', socket.id);
            }
            // inform everyone of their disconnection
            socket.broadcast.emit(roomDisconnectionKey, userId);

            //TODO: flush redis when room is empty?
        });
    });
});
