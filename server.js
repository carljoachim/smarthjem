var http = require("http");
var net = require('net');

var express = require("express");
var app = express();
app.use(express.static(__dirname + '/public'));

var http = http.createServer(app).listen(8080);

var wsock = require('socket.io').listen(http);
var tcpsock = require('net');

var tcp_HOST = 'localhost';
var tcp_PORT = 8000;

wsock.configure(function() {
	wsock.set("log level", 2); 
});

wsock.sockets.on('connection', function (socket) { 
    var tcpWebClient = new tcpsock.Socket();
    tcpWebClient.setEncoding("ascii");
    tcpWebClient.setKeepAlive(true);

    tcpWebClient.connect(tcp_PORT, tcp_HOST, function() {

        tcpWebClient.write("Web koblet til");
        tcpWebClient.on('data', function(data) {            
            socket.emit("simulated-data", data);
        });    
      
    });

    socket.on('disconnect', function(data){
         tcpWebClient.end();
    });

    socket.on('heating-settings', function(data){
    	 tcpWebClient.write(data);
    });

});


