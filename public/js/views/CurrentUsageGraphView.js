(function(SH){
    SH.CurrentUsageGraphView = Simple.View.extend({
    	
    		highChart: null,

    		totalInfoContentTemplate: 
    			"<div id='total-usage'> Forbruk: <label> </label> </div>" +
    			"<div id='total-cost'> Kostnad: <label> </label> </div>" +
    			"<div id='total-date-from'> Fra dato: <label> </label> </div>" +
    			"<div id='total-date-to'> Til dato: <label> </label> </div>",    		

			initialize: function(options){
	    		this.model = options.model;	
	    		
	    		Simple.Events.on("powerPrices:fetched", this.showGraphInfo);

	    		$(".total-info-wrapper").html(this.totalInfoContentTemplate);
 
	    		this.createGraph(this.model);	 
	   		
	    	},
	    	showGraphInfo: function(){	    		
	   			if($(".current-usage-graph-view").highcharts() != undefined){
                    var today = new Date();
                    var chart = $(".current-usage-graph-view").highcharts();
                    chart.xAxis[0].setExtremes(today - SH.Utils.OneWeek, today);
                    
                }
		  	},
	    	createGraph: function(elDevicesData){
	    		$(".current-usage-graph-view").highcharts('StockChart', {
	    			 chart: { 
	    			 	type: 'scatter',
	                    zoomType: 'x'
	                },
	                title: { 
	                    text: 'Totalt forbruk'
	                },                
	                xAxis: {
	                    type: 'datetime',
	                    title: {
	                        text: 'Tid'
	                    }, 
	                    labels: {
	                        overflow: 'justify'
	                    },
	                    events: {
	                        afterSetExtremes: function(e) {
	                             var sum = 0;
	                             var cost = 0;
	                             var hours = [];


	                             if(window.powerPrices != undefined){
		                             for(var i = 0; i < this.series[0].points.length; i++){
		                                if(this.series[0].points[i].y > 0 && this.series[0].points[i].x >= e.min){		                          
		                                	 //console.log(this.series[0].points[i]);

		                                     sum += this.series[0].points[i].y;
		                                    
		                                     //var hourOn = new Date(this.series[0].points[i].x - (SH.Utils.OneHour * 2)).getHours();                              
		                                     //var date = SH.Utils.getDateFormat(new Date(this.series[0].points[i].x - (SH.Utils.OneHour * 2)));
		                                     
		                                     var hourOn = moment(this.series[0].points[i].x).format("H");
		                                     var date = moment(this.series[0].points[i].x).format("DD.MM.YY");

									         for(var j = 0; j < window.powerPrices.length; j++){
		                                         if(window.powerPrices[j].date == date){
		                                             if(hourOn == 0) hourOn = 24;

		                                             cost += (this.series[0].points[i].y/ 1000) * window.powerPrices[j].prices[hourOn - 1];
		                                         }
		                                     }                        
		                                 }                                                     
		                            }
	                            }
	                      		
	                            (sum > 1000) ?  $("#total-usage").find("label").text((sum / 1000).toFixed() + " kWt") : $("#total-usage").find("label").text(sum.toFixed() + " Wt");
	                            $("#total-cost").find("label").text(Math.round(cost * 100) / 100 + " kr");

								var fromDate = moment(e.min).format('LLLL');
	                            var toDate = moment(e.max).format('LLLL');
	                           	                            
	                            $("#total-date-from").find("label").text(fromDate);
	                            $("#total-date-to").find("label").text(toDate); 

	                        }
	                    }
	                },
	             	tooltip: {	             		
						useHTML: true,
					    formatter: function(){
					    	var time = moment(this.key).format("LLLL");
					    	var cost = 0;
					    	var date = moment(this.key).format("DD.MM.YY");
					    	var hourOn = moment(this.key).format("H");

					    	for(var j = 0; j < window.powerPrices.length; j++){					    	
                                 if(window.powerPrices[j].date == date){
                                     if(hourOn == 0) hourOn = 24;                                    
                                     cost = (this.y/ 1000) * window.powerPrices[j].prices[hourOn - 1];
                                     cost = Math.round(cost * 100) / 100;
                                 }
                             }  

					    	var s = "<div> " + time + "</div></br>" +
					    			"<div> Forbruk: " + this.y + " W</div></br>" +
					    			"<div> Kostnad: " + cost + " kr</div></br>";
					    	
					    	return s
					    }
					},
	                yAxis: {
	                    title: {
	                        text: 'Watt'
	                    },
	                    min: 0,	                                     
	                },                     
	                navigator: {
	                    enabled: false
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
	                },	               
	                plotOptions: {
		                scatter: {
		                	marker: {
		                		radius: 2
		                	},
		                    lineWidth: 1
		                }
		            },
	                series : [{
	                        name : 'Forbruk W',            
	                        animation: false,	
	                        pointInterval: SH.Utils.OneHour,          
	                        pointStart: Date.UTC(2012, 11, 31),  
	                        data :  
	                        (function() {
	                            var data = [];                     
	                            var weeks = ((new Date() - Date.UTC(2012, 11, 31)) / SH.Utils.OneWeek) - 1; 
	                            
	                            for(var i = 0; i < weeks; i++) {	                             
	                                 for(var j = 0; j < elDevicesData.activeHours.length; j++){
	                                                             
	                        			data.push(elDevicesData.activeHours[j]);
	                        			                                    	                                                               
	                                 }   	                                                 
	                            }

	                            return data;

	                        }).bind(this)(),
	                        step: 'left'
	                    }]

	            });
 	  	},		

    });
})(window.SH = window.SH || {});