(function(SH){
        SH.ElDeviceInfoBoxModel = Simple.Model.extend({

        elId: null,
        name: null,
        effect: null,
        room: null,
        active: null,
        activeHours: null,
        
        initialize: function(data){ 	 
        	this.elId = data.elId;
        	this.name = data.name();
        	this.effect = data.effect;
        	this.room = data.room;
        	this.active = data.active;
            this.activeHours = data.activeHours;

            
      	}


    	});        
})(window.SH = window.SH || {});