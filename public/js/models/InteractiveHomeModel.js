(function(SH){
    SH.InteractiveHomeModel = Simple.Model.extend({
    	stage: null,
    	rooms: [],
    	totalUsage: 0,
    	elId: 1,
    	elDevices: [],
    	
 		
        initialize: function(){ 	
        	this.createStage();

        	window.rooms = this.rooms;
		
        	
        	Simple.Events.on("elArticleInfoBox:click", this.elArticleChanged.bind(this))

        	this.addRoom("Kjøkken", 70, 310, 290, 200, 20);
        	this.addRoom("Stue", 360, 460, 370, 200, 20);        	
        	this.addRoom("Soverom", 70, 510, 290, 150, 18);
        	this.addRoom("Bad", 360, 310, 370, 150, 24);

			this.addElDevice(1, "Lampe", true, 80, 118, "Soverom", true);             	
         	this.addElDevice(2, "Lampe", true, 190, 118, "Soverom", true);
        	    	
      		this.addElDevice(1, "Cooker", false, 110, 0, "Kjøkken", false);  
         	this.addElDevice(1, "Microwave", false, 0, 80, "Kjøkken", false);        	
         	this.addElDevice(1, "Fridge", true, 0, 140, "Kjøkken", true);
         	this.addElDevice(1, "Toaster", false, 0, 40, "Kjøkken", false);
         	this.addElDevice(1, "Teapot", true, 50, 0, "Kjøkken", false);

         	this.addElDevice(1, "Tumble", false, 50, 0, "Bad", false);
         	this.addElDevice(1, "WashingMachine", false, 0, 0, "Bad", false);

         	this.addElDevice(3, "Lampe", true, 5, 5, "Stue", true);        	
         	this.addElDevice(1, "TV", true, 145, 0, "Stue", true);
         	this.addElDevice(1, "Playstation", false, 145, 30, "Stue", false);
         	this.addElDevice(1, "PC", true, 75, 168, "Stue", true);

			var currentUsageModel = new SH.CurrentUsageModel(this.elDevices);
			var currentUsageGraphView = new SH.CurrentUsageGraphView({ el: $(".current-usage-graph-view"), model: currentUsageModel });
        
        	this.activeArticles();
    	},

    	createStage: function(){
    		this.stage = new Kinetic.Stage({
			 	width: 800,
				height: 800,
				container: 'home'
			});   	

    	},        

    	addRoom: function(name, posX, posY, width, height, degrees){
    		var room = new Kinetic.Layer({
    			name: name,   
			    x: posX, 
		        y: posY,
		        width: width,
		        height: height		     
    		});

    		var roomOverlay = new Kinetic.Rect({
		        width: width,
		        height: height,    		      
		        fill: 'grey',
		        opacity: 0.1,
		        stroke: 'black',
		        strokeWidth: 2
	      	});

	      	var roomNameLabel = new Kinetic.Label({
		        x: width - (name.length * 9 + 4),
		        opacity: 0.5
		    });		            
		      
		    roomNameLabel.add(new Kinetic.Text({
		       text: name,
		       fontFamily: 'Calibri',
		       fontSize: 18,
		       fill: 'black'
		    }));

		    var roomDegreesLabel = new Kinetic.Label({
		        x: width - 35,
		        y: 22,
		        opacity: 0.5
		    });		            
		      
		    roomDegreesLabel.add(new Kinetic.Text({
		       text: degrees + " °C",
		       fontFamily: 'Calibri',
		       fontSize: 14,
		       fill: 'black'
		    }));
		      
    		room.add(roomOverlay);
    		room.add(roomNameLabel);    		
    		room.add(roomDegreesLabel);
    		
    		this.rooms.push(room);
    		this.stage.add(room);
    	},
    	
    	addElDevice: function(number, name, active, posX, posY, roomName){
			var room;

			for(var i = 0; i < this.rooms.length; i++){
				if(this.rooms[i].name() == roomName){
    				room = this.rooms[i];
    			}
    		}

    		var elDevice = new Kinetic.Image({
    				name: name,
				    width: 30,
				    height: 30,
				    x: posX,
				    y: posY,
				    draggable: true,
				    dragBoundFunc: this.dragBoundFuncForRoom	 
				});


    	
    		for (var i = 0; i < elObjects.length; i++) {
				if(elObjects[i].number == number && elObjects[i].name == name){
					SH.Utils.elUsageTime(elObjects[i], this.elId);
					elDevice.effect = elObjects[i].effect;
					elDevice.activeHours = elObjects[i].days;
				}
			};			

   			var imgObjOn = new Image();   
	   		imgObjOn.src = '../../img/icons/' + name + '-on.png'	

   			var imgObjOff = new Image();   
	   		imgObjOff.src = '../../img/icons/' + name + '-off.png'	

    		elDevice.active = active;
    		elDevice.room = room.name();
    		elDevice.elId = this.elId;

    		this.elId++;

    		room.add(elDevice);

    		if(elDevice.active){
    			imgObjOn.onload = function(){
					elDevice.setImage(imgObjOn);
					room.draw();
				}
    		}else{
    			imgObjOff.onload = function(){
					elDevice.setImage(imgObjOff);
					room.draw();
				}
    		}	   		

			elDevice.on("mouseenter", function(){
				document.body.style.cursor = 'pointer';
			})
			elDevice.on("mouseleave", function(){
				document.body.style.cursor = 'default';
			})

			var elDeviceInfoBoxModel = new SH.ElDeviceInfoBoxModel(elDevice);
			var elDeviceInfoBoxView = new SH.ElDeviceInfoBoxView({ el: $(".elDevice-infobox"), model: elDeviceInfoBoxModel });
     
			elDevice.on("click", function(){
				elDeviceInfoBoxView.showBox(elDevice);	
			}.bind(this))		

			this.elDevices.push(elDevice);
    	},
    	elArticleChanged: function(data){
    		var elDevice = this.getElArticle(data.elId);
    		var room = this.getRoom(data.elId);
 			
			var imgObjOff = new Image();   
			var imgObjOn = new Image();   

			imgObjOff.src = '../../img/icons/' + elDevice.name() + '-off.png'	
	   		imgObjOn.src = '../../img/icons/' + elDevice.name() + '-on.png'	

			elDevice.active = data.active;		

			if(elDevice.active){
				imgObjOn.onload = function(){
					elDevice.setImage(imgObjOn);
					room.draw();
				}
			}else{ 
				imgObjOff.onload = function(){
					elDevice.setImage(imgObjOff);
					room.draw();
				}
			}    	
			this.activeArticles();		
		},
		getRoom: function(elArticleId){		
			for (var i = 0; i < window.rooms.length; i++) {				
				for (var j = 1; j < window.rooms[i].children.length; j++) {
					if(window.rooms[i].children[j].elId == elArticleId){
						return window.rooms[i];
					}
				}
			}
		},
		getElArticle: function(elArticleId){
			for (var i = 0; i < window.rooms.length; i++) {				
				for (var j = 1; j < window.rooms[i].children.length; j++) {
					if(window.rooms[i].children[j].elId == elArticleId){
						return window.rooms[i].children[j];
					}
				}
			}
		},

    	dragBoundFuncForRoom: function(pos){
    		 var room;	
    		 for (var i = 0; i < window.rooms.length; i++) {
    		 	if(window.rooms[i].name() == this.parent.name()){
    		 		room = window.rooms[i];
    		 	}
    		 };

    		 var newX = pos.x;
			 var newY = pos.y;
	 
			 if(pos.x < room.position().x) newX = room.position().x;
			 if(pos.x > room.position().x + room.getWidth() - this.width()) newX = room.position().x + room.getWidth() - this.width();

		     if(pos.y < room.position().y) newY = room.position().y;
			 if(pos.y > room.position().y + room.getHeight() - this.height()) newY = room.position().y + room.getHeight() - this.height();
	     		

	       //   var x = newX - 360;
	       //   var y = newY - 460;	
	     	 // console.log("X: " + x + " Y:" + y);
		     
		     return {
		          x: newX,
		          y: newY
		        };
		     },	
	     
		activeArticles: function(){
			this.totalUsage = 0;
			for (var i = 0; i < window.rooms.length; i++) {
				for(var j = 1; j < window.rooms[i].children.length; j++){
					if(window.rooms[i].children[j].active){
						this.totalUsage += window.rooms[i].children[j].effect;

					}
				}
			};
			Simple.Events.trigger("InteractiveHome:active-articles", this.totalUsage);
		}  	

	});  
})(window.SH = window.SH || {});