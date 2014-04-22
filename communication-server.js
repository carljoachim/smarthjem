var net = require('net');

var HOST = 'localhost';
var PORT = 8000;

var clients = [];

var server = net.createServer(function(client) {
	
  client.id = Math.floor(Math.random() * 100000)  + 1;
  clients.push(client);

  client.on('data', function (data) {  
    if(data[0] == 49) client.id = 1;   

    console.log("Tilkoblete klienter: ");
    for (var i = 0; i < clients.length; i++) {
      console.log(clients[i].id + " ");
    };

	  broadcast(data, client);     
  });	 

  function broadcast(message, sender) {
    clients.forEach(function (client) {
       if(client == sender) return;
       
       client.write(message + "\n");
    });
  }

  client.on('end', function () {
      clients.splice(clients.indexOf(client), 1);
  });

}).listen(PORT, HOST);
   
console.log('Communication server lytter til port 8000');