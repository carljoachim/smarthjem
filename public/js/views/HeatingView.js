(function(SH){
    SH.HeatingView = Simple.View.extend({
 			
    		events: {
 				"click [name=simulate]" : "simulate",
 				"click .activate-button" : "activateAlert"
 			},

	    	newCalculatedDataString: "",

			initialize: function(options){
				$("#progressbar").show();
				this.createCalendar();
				this.generateOrUpdateTempSimulationGraph("");

	            Simple.Events.on("new-simulated-data", this.controlMatlabData.bind(this));
                Simple.Events.on("finish-parsing-matlabsimulation", this.finishParsingMatlabsimulation);
                Simple.Events.on("got-complete-data-string", this.generateOrUpdateTempSimulationGraph.bind(this));


				$(document).keyup(function(e) {
				  if (e.keyCode == 46) { 
				  	var events = this.getVisibleEvents();
				  	for (var i = 0; i < events.length; i++) {
				  		if(events[i].selected){
				  			var remove = [];
				  			remove.push(events[i]._id);
				  			$('.calendar').fullCalendar( 'removeEvents', remove );
				  		}
				  	};
				  }
				}.bind(this));
			},
			matlab: {
				PowerPrices: null,
    		 	WeatherData: null	  
			},
			currentComfort: null,
			currentLimit: null,
			currentNumOfDays: null,
	    	simulate: function(){	    		
	    		var daysToSimulate = parseInt($("[data-name=days]").val());
	    		var weighting = parseInt($("[data-name=weighting]").val());
	    		
	    		if(!window.weekForecast){
				 	$(".error-msg").text("Problemer med å hente værdata. Vennligst last siden på nytt.");
				 	return;
    			} 

    			var powerPrices = SH.Utils.getPowerPricesFromNowTheNextDays(daysToSimulate); 
	    		var weatherData = SH.Utils.getWeatherForecastTheNextDays(daysToSimulate);    
	    		var comfortTemp = $("[data-name=comfort]").val(); 	
	    		var limitTemp = $("[data-name=lowlimit]").val();
	    		var events = this.getVisibleEvents();
			    
			    console.log(events);	
	    		var activityList = SH.Utils.getActivityList(daysToSimulate, events, comfortTemp, limitTemp);

	    		this.matlab.PowerPrices = powerPrices;
	    		this.matlab.WeatherData = weatherData;
	    		this.matlab.ActivityList = activityList;
	    		this.matlab.HoursToSimulate = daysToSimulate * SH.Utils.HoursInDay;
	    		this.matlab.Weighting = weighting;
	    		this.matlab.ComfortTemp = comfortTemp;
	    		this.matlab.LimitTemp = limitTemp;

	    		this.currentComfort = comfortTemp;
				this.currentLimit = limitTemp;	   
				this.currentNumOfDays = daysToSimulate; 		    		

	    		Simple.Events.trigger("heating-settings", this.matlab); 
	    		$("#progressbar").show();
	    		this.progressBar(daysToSimulate);
	    		
	    	},
	    	activateAlert: function(){

	    		bootbox.alert("Nye temperaturinnstillinger aktivert");
	    	},
	    	getVisibleEvents: function(){
	    		var eventsList = [];
				var cal = $('.calendar').fullCalendar('getView');
				
				var array = $('.calendar').fullCalendar('clientEvents', function(events){    	
	    			if(events.start >= cal.visStart && cal.visEnd >= events.end){
	    				 eventsList.push(events);
	    			}	 	    			  					
	    		}); 	
	    		return eventsList;
	    	}, 
	    	createCalendar: function(){
	    		var date = new Date();
				var d = date.getDate();
				var m = date.getMonth();
				var y = date.getFullYear();
				var today = date.getDay();
				
				$('.calendar').fullCalendar({
						monthNames: ["Januar","Februar","Mars","April","Mai","Juni","Juli", "August", "September", "Oktober", "November", "Desember" ], 
					    monthNamesShort: ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des'],
					    dayNames: [ 'Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
					    dayNamesShort: ['Søn', 'Man','Tir','Ons','Tor','Fre','Lør'],
					    columnFormat: {
			                month: 'ddd',   
			                week: 'ddd d/M', 
			                day: 'dddd d/M'  
			            },
			            slotMinutes: 60,
					    buttonText: {
						    today: 'idag',
						    month: 'måned',
						    week: 'uke',
						    day: 'dag'
					    }, 
					    titleFormat: {					    	
						    month: 'MMMM yyyy',
							week: "d[ MMMM][ yyyy]{ '&#8212;' d MMMM yyyy}",
							day: 'dddd, MMM d, yyyy'			
					    },
					    firstDay: today,					   
					    allDaySlot: false,
				        axisFormat: '(HH:mm)', 
					    timeFormat: '(HH:mm)', 
					    defaultView: 'agendaWeek',  
				 		aspectRatio: 8,
				 		height: 600,
						header: {
							left: 'prev,next',
							center: 'title'
						},
						editable: true,
						dayClick: function(date, allDay, jsEvent, view) {
							var newEvent = {
							 title: 'Hjemme',							
							 start: date,
							 end: date + date.getHours() + 2,
							 allDay: false
							};
							$('.calendar').fullCalendar( 'renderEvent', newEvent, true ) 
						},
						eventClick: function(e){													      
							if($(this).css('border-color') == "rgb(255, 0, 0)"){
								$(this).css('border-color', "rgb(58,135,173)");
								e.selected = false;
							} 
							else{
								$(this).css('border-color', 'red');
								e.selected = true;
							}
						},
						events: {
							url: "https://www.google.com/calendar/feeds/hjn1miff5jsulb4qo4lbeosius%40group.calendar.google.com/public/basic",
							editable: true
						} 
						
					});
	    	},
	    	controlMatlabData: function(data){
	    		for (var i = 0; i < data.length; i++) {
	    			this.newCalculatedDataString += data[i];
	    			if(data[i] == 'X'){
	    				Simple.Events.trigger("got-complete-data-string", this.newCalculatedDataString);
	    				this.newCalculatedDataString = "";
	    				$("#progressbar").hide();
	    			}
	    		};
	    	},
	    	progressBar: function(daysToSimulate){
	    		var progress = 0;
	    		var x = 0;
	    		switch (daysToSimulate) {
				    case 1: 
				    	x = 60;
				    break;
				    case 2: 
				    	x = 110;
				    break;
				    case 3: 
				    	x = 160;
				    break;
				    case 4: 
				    	x = 210;
				    break;
				    case 5: 
				    	x = 260;
				    break;
				    case 6: 
				    	x = 310;
				    break;				  
				}
			    var timer = setInterval(updateProgressbar, x);
			    
			    function updateProgressbar(){			    	
			        $("#progressbar").progressbar({			        	
			            value: ++progress
			        });
			        if(progress == 100)
			            clearInterval(timer);
			    }
			    
			    $(function () {			    	
			        $("#progressbar").progressbar({
			            value: progress
			        });
			    });
	    	},
	    	addTableElement: function(simulationObject, number){
	    		var dailyCost = (simulationObject.Cost / this.currentNumOfDays).toFixed(1);
	    		var percentage = ((10 - dailyCost) * 100  / 10).toFixed(1);    		
	    		
	    		 var tableRow = "<tr>" +
	    		 					"<td>" + number + "</td>" +
	    		 					"<td>" + this.currentComfort + "</td>"	+
	    		 					"<td>" + this.currentLimit + "</td>"	+
	    		 					"<td>" + this.currentNumOfDays + "</td>" +
	    		 					"<td>" + dailyCost.replace(".", ",") + " kr </td>" +
	    		 					"<td class='percentage' data-nr=" + number + ">" + percentage + " % </td>" +
	    		 					"<td > <button class='activate-button'>Ok</button> </td> " +
	    						"</tr>";	    						

	    		 $(".cost-table").find("table").append(tableRow);
	    		 (percentage >= 0) ? $("td[data-nr=" + number + "]").css('color', 'green') : $("td[data-nr=" + number + "]").css('color', 'red');
	    		
	    	},
	    	generateOrUpdateTempSimulationGraph: function(data){	    		
	    		var chart = $(".simulation-temperatur-graph").highcharts();

	    		var simulationDataObject = SH.Utils.parseMatlabString(data);	
	    		
	    		if(chart){
					for (var i = 0; i < simulationDataObject.Degrees.length; i++) {
						for (var j = 0; j < simulationDataObject.Degrees[i].length; j++) {
							simulationDataObject.Degrees[i][j] = simulationDataObject.Degrees[i][j];
						};
					};	

					var number = $(".cost-table").find("tr").length - 1;

		            chart.addSeries({
	            	    name: "Nr " + number,
		                data: simulationDataObject.Degrees
		            });
		            this.addTableElement(simulationDataObject, number);

				}else{
					$(".simulation-temperatur-graph").highcharts({
		                chart: { 
		                    height: 400,
		                    width: 700,
		                    zoomType: 'x',
		                    type: 'spline',
		                },
		                title: { 
		                    text: 'Temperaturer'
		                },            
		                xAxis: {
		                    type: 'datetime',
		                    title: {
		                        text: 'Tid'
		                    },                   

		                    labels: {
		                        overflow: 'justify'
		                    },        
		                    minRange: SH.Utils.OneHour            
		                },
		                yAxis: {
		                    title: {
		                        text: 'Temperatur'
		                    },
		                },  
	                   plotOptions: {
			                spline: {
			                    marker: {
			                        radius: 0,
			                        lineWidth: 1
			                    }
			                }
			            },
		                rangeSelector: {
		                    selected: 1,
		                    buttons: 
		                        [{
		                            type: 'day',
		                            count: 1,
		                            text: '1d'
		                         },
		                         {
		                            type: 'week',
		                            count: 1,
		                            text: '1w'
		                         },
		                         {
		                            type: 'month',
		                            count: 1,
		                            text: '1m'
		                         },
		                      	 {
		                            type: 'year',
		                            count: 1,
		                            text: '1y'
		                         }]
		                }
		            });
	    		}

			}

    });
})(window.SH = window.SH || {});