/*global $:false */ //prevent "'$' is not defined."
/*global io:false */ //prevent "'io' is not defined."
'use strict';

var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});

var canvas = document.getElementById('mainCanvas');
var context = canvas.getContext('2d');

var socket = io.connect('http://localhost:3000');

var clearCanvas = function(){
    // Store the current transformation matrix
    context.save();

    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Restore the transform
    context.restore();
};

var drawData = function(data) {
    if(data.type === 'clear'){
        clearCanvas();
    }
    else if(data.type === 'lineStart'){
        context.beginPath();
        context.lineTo(data.offsetX, data.offsetY);
        context.stroke();
    }
    else if(data.type === 'lineCont'){
        context.lineTo(data.offsetX, data.offsetY);
        context.stroke();
    }
    else if(data.type === 'rect'){
        context.rect(data.offsetX, data.offsetY, 1, 1);
        context.stroke();
    }
};

var sendSocketData = function(e, type, key){
    var data = {
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        userId: guid
    };

    data.type = type;

    console.log('sending data to socket', data);
    socket.emit(key, data);
};

var createCursor = function(userId){
    //create a cursor for the user
    return $("<img/>", {
        "id": userId,
        "class": "cursor",
        "src": "cur2014.png"
    })
    .css({
        position: 'absolute'
    })
    .appendTo('body')[0];
};

var eventKey;
var historyKey;
var mouseEventKey;

socket.on('connect', function () {
    console.log('connected');

    //determine which room user belongs in
    var location = window.location;
    var roomId;

    //join an existing room
    if(location.hash.length){
        //trim the #/
        roomId = location.hash.substr(2);
        console.log('joined room', roomId);
    }
    else{
        //create a room we are not already in one
        var origin = location.origin;

        //use the last 12 digits of the GUID as the roomId
        roomId = guid.substr(guid.length-12);
        location.assign(origin + '/#/' + roomId);
        console.log('created room', roomId);
    }

    eventKey = 'message-' + roomId;
    historyKey = 'messages-' + roomId;
    mouseEventKey = 'mouse-' + roomId;
    var roomConnectionKey = 'userConnected-' + roomId;
    var roomConnectionHandshakeKey = 'handshakeConnection-' + roomId;
    var roomDisconnectionKey = 'userDisconnected-' + roomId;


    //tell everyone that you have joined their room
    socket.emit('roomConnection', roomId, guid);

    //after you have told everyone that you have joined thier room,
    //they should shake your hand and tell you about themselves
    socket.on(roomConnectionHandshakeKey, function(handshake){
        //make a cursor and track movements for existing room users
        console.log(handshake.responder, 'has shaken your hand');

        var userId = handshake.responder;
        createCursor(userId);
    });

    //after you join the room, retrieve and retrace all previous moves
    socket.on(historyKey, function (data) {
        console.log('got socket history data', data);
        data.forEach(function(dataString) {
            var data = JSON.parse(dataString);
            drawData(data);
        });
    });

    //listen for other users joining the room
    socket.on(roomConnectionKey, function(userId){
        console.log(userId, 'has joined the room');

        var cursor = createCursor(userId);

        //inform the new user of your precense in the room
        //currently you know about them, but they don't know about you
        var handshake = {
            roomId: roomId,
            initiator: userId,
            responder: guid
        };
        //TODO: make handshake class?
        socket.emit(roomConnectionHandshakeKey, handshake);
    });

    //track other user's mouse movement
    socket.on(mouseEventKey, function (data) {
        console.log('got mouse data', data);

        var cursor = $('#' + data.userId)[0];
        // context.drawImage(cursor, data.offsetX, data.offsetY);
        $(cursor).css({
            left:data.offsetX,
            top:data.offsetY
        });
    });

    //send canvas events to socket server, which are then shared to other users
    socket.on(eventKey, function (data) {
        console.log('got socket data', data);
        drawData(data);
    });

    //listen for other users leaving the room
    socket.on(roomDisconnectionKey, function(userId){
        console.log(userId, 'is leaving room');

        //when a user leaves, delete his cursor
        var cursor = $('#' + userId)[0];
        cursor.remove();
    });

    //save the canvas on appropriate keypress
    $(window).keypress(function(e){
        console.log('keypress', e);

        if(e.keyCode === 115 || e.keyCode === 83){
            //'s' or 'S'
            console.log('saving canvas');

            try {
                var isFileSaverSupported = !!new Blob;

                if(isFileSaverSupported){
                    canvas.toBlob(function(blob) {
                        saveAs(blob, 'draw-' + roomId + '.png');
                    });
                }
                else{
                    console.error('FileSave is not supported');
                }
            } catch (e) {
                console.error('error saving canvas', e);
            }
        }
    });
});

$(canvas)
.mousedown(function(e1) {
    // console.log('e1 fired');
    //place a single 'pixel' at point of click
    context.rect(e1.offsetX, e1.offsetY, 1, 1);
    context.stroke();
    sendSocketData(e1, 'rect', eventKey);

    //begin continuous line if user wants to drag
    context.beginPath();
    context.lineTo(e1.offsetX, e1.offsetY);
    context.stroke();
    sendSocketData(e1, 'lineStart', eventKey);

    $(window).mousemove(function(e2) {
        // console.log('e2 fired');
        // context.rect(e2.offsetX, e2.offsetY,2, 2);
        context.lineTo(e2.offsetX, e2.offsetY);
        context.stroke();
        sendSocketData(e2, 'lineCont', eventKey);
    });
})
.mouseup(function() {
    //stop drawing
    // console.log('stop drawing');
    $(window).unbind('mousemove');
})
.mousemove(function(e){
    // console.log('x', e.offsetX, 'y', e.offsetY);
    //TODO: mod 3 or something like that?
    sendSocketData(e, 'mousemove', mouseEventKey);
});

$(window).keypress(function(e){
    console.log('keypress', e);
    if(e.keyCode === 99 || e.keyCode === 67){
        //'c' or 'C'
        clearCanvas();
        socket.emit(eventKey, {
            type: 'clear',
            userId: guid
        });
    }
});
