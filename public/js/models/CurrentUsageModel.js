(function(SH){
        SH.CurrentUsageModel = Simple.Model.extend({

        elDevices: [],
        totalEffect: 0,
        activeHours: [],
         	
        initialize: function(data){ 
	    	this.elDevices = data;

	    	for(var i = 0; i < this.elDevices.length; i++){
    		  	this.totalEffect += this.elDevices[i].effect;
	    	}

	    	this.getActiveHours();
        },

        getActiveHours: function(){
        	for (var i = 0; i < this.elDevices.length; i++) {
        		if(i == 0){
					for (var key in this.elDevices[i].activeHours) {                    
	                    for(var j = 0; j < this.elDevices[i].activeHours[key].length; j++){
           					this.activeHours.push(this.elDevices[i].activeHours[key][j]);           		
           				}
           			}     
           		}
           		else{
           			var count = 0;
           			for (var key in this.elDevices[i].activeHours) {                    
	                    for(var j = 0; j < this.elDevices[i].activeHours[key].length; j++){	                  
	                   		this.activeHours[count] += this.elDevices[i].activeHours[key][j];
                   		  	count++;
	       				}
           			}        
           		}           		                           
        	};
        
        }
	});        
})(window.SH = window.SH || {});