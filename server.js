'use strict';

var express = require('express'),
    redis = require('redis'),
    app = express();

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

var io = require('socket.io').listen(server);

app.get('/', function index(req, res){
    res.sendfile(__dirname + '/public/canvas.html');
});

var redisclient = redis.createClient();

redisclient.on("error", function (err) {
    console.log("redis error " + err);
});

io.sockets.on('connection', function (socket) {
    socket.broadcast.emit('user connected');

    //retrieve and send the history of previously recieved messages
    redisclient.lrange('messages', 0, -1, function(err, items){
        if(err){
            console.log("error retrieving messages from redis: " + err);
        }
        else{
            console.log(items.length + " items:");
            items.forEach(function (reply, i) {
                console.log("    " + i + ": " + reply);
            });

            socket.emit('messages', items);
        }
    });

    socket.on('message', function (data) {
        console.log('message from', data.from, '. data', data);

        //add message to history
        redisclient.rpush('messages', data);

        // sending to all clients except sender
        socket.broadcast.emit('message', data);
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit('user disconnected');
    });
});
