var express = require('express'),
    bodyParser = require('body-parser');

var app = express();
var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

app.get('/', function index(req, res){
  res.sendfile(__dirname + '/public/canvas.html');
});
