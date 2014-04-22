(function(SH){
        SH.HeatingModel = Simple.Model.extend({

      
         	
        initialize: function(data){ 
        	socket = io.connect("localhost", {port: 8000}); //Kan sløyfes??

	   		Simple.Events.on("heating-settings", this.sendHeatingSettings);

            socket.on("simulated-data", function(data){
                Simple.Events.trigger("new-simulated-data", data);                  
            }); 
	   		
        },
        
        sendHeatingSettings: function(data){
        	var string = JSON.stringify(data);
        
        	socket.emit('heating-settings', string);

		}
        
	});        
})(window.SH = window.SH || {});