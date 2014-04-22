(function(SH, Mustache){
    SH.ElDeviceInfoBoxView = Simple.View.extend({
		template: 
			"<div class='elDevice-infobox-close'>X</div>" +
 	    	"<img class='elDevice-infobox-logo' src='img/icons/{{name}}.png'></img>" +
        	"<div class='elDevice-infobox-header'>{{name}} </div>" +
        	"<div class='elDevice-infobox-stats'>" + 
	     		"<div class='elDevice-infobox-time'> <label id='from-date'></label> - <label id='to-date'></label>   </div>" + 
	     		"<div class='elDevice-infobox-usage'>Bruk: <label id='usage'>  </label> </div>" + 
     			"<div class='elDevice-infobox-cost'>Kostnad: <label id='cost'> </label> </div>" + 
	     	"</div>" +
        	"<div class='elDevice-infobox-data'>" +
        		"<div class='elDevice-infobox-effect'> Effekt: <label> {{effect}} </label> W </div>" +
        		"<div class='elDevice-infobox-room'> Rom: <label> {{room}} </label>	</div>" +
            "<div class='btn-group btn-toggle'>" +
            	"<button class='btn btn-primary active' data-active='true'>ON</button>" +
			    "<button class='btn' data-active='false'>OFF</button>" +
		    "</div>" +
		    "<div class='elDevice-infobox-graph'> </div>"
		,
	    events: {	    	
	    	"click .elDevice-infobox-close" : "closeEldeviceInfoBox"
	    },
		initialize: function(options){ 
    		this.model = options.model;	
    		this.el.hide();

        
      	},

		showBox: function(data){
			$(".elDevice-graph").hide();

			var renderedTemplate = Mustache.to_html(this.template, this.model);
    		this.el.html(renderedTemplate);
			this.el.fadeIn();

			var elId = this.model.elId;

			if(!data.active) this.el.find('.btn').toggleClass('active').toggleClass('btn-primary');
			
    		this.el.find('.btn-toggle').click(function() {
				$(this).find('.btn').toggleClass('active');  

			    if ($(this).find('.btn-primary')) {
			    	$(this).find('.btn').toggleClass('btn-primary');
			    
				}
				var active = $(this).find('.btn.active').attr("data-active") === "true";
				
				Simple.Events.trigger("elArticleInfoBox:click", {elId: elId, active: active});
			}); 	

            var elDeviceData = data;
			$(".elDevice-infobox-graph").on("click", function(){
                     this.showEldeviceGraph(elDeviceData);

                    if($(".elDevice-graph").highcharts() != undefined){
                            var today = new Date();
                            var chart = $(".elDevice-graph").highcharts();
                            chart.xAxis[0].setExtremes(today - SH.Utils.OneWeek, today);
                    }
                }.bind(this)
            );

            

		},
		closeEldeviceInfoBox: function(){
			this.el.fadeOut("fast");
            $(".elDevice-graph").fadeOut("fast");
		},
		showEldeviceGraph: function(elDeviceData){
            $(".elDevice-graph").show();
		    $(".elDevice-graph").highcharts('StockChart', {
                chart: { 
                    height: 400,
                    zoomType: 'x',
                    type: 'scatter',
                },
                title: { 
                    text: 'Forbruk'
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

                            for(var i = 0; i < this.series[0].points.length; i++){
                                console.log()
                                if(this.series[0].points[i].y > 0 && this.series[0].points[i].x >= e.min){  
                                    
                                    sum += this.series[0].points[i].y;                                    

                                    var hourOn = moment(this.series[0].points[i].x).format("H");
                                    var date = moment(this.series[0].points[i].x).format("DD.MM.YY");
                                    
                                    for(var j = 0; j < window.powerPrices.length; j++){
                                        if(window.powerPrices[j].date == date){
                                            if(hourOn == 0) hourOn = 24;

                                            cost += (elDeviceData.effect/ 1000) * window.powerPrices[j].prices[hourOn - 1];
                                        }
                                    }                        
                                }                                                     
                            }
                      
                            (sum > 1000) ?  $("#usage").text((sum / 1000).toFixed() + " kWt") : $("#usage").text(sum.toFixed() + " Wt");
                            $("#cost").text(Math.round(cost * 100) / 100 + " kr");

             		        
                            var fromDate = moment(e.min).format('llll');
                            var toDate = moment(e.max).format('llll');

                            $("#from-date").text(fromDate);
                            $("#to-date").text(toDate); 

                        }
                    }
                },
                yAxis: {
                    title: {
                        text: 'Watt'
                    },
                    min: 0,
                    tickInterval: elDeviceData.effect,
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
                                radius: 0
                            },
                            lineWidth: 1
                        }
                    },
                series : [{
                        name : 'Forbruk W',            
                        pointInterval: SH.Utils.OneHour,          
                        pointStart: Date.UTC(2012, 11, 31),  
                        data :  
                        (function() {
                            var data = [];                     
                            var weeks = ((new Date() - Date.UTC(2012, 11, 31)) / SH.Utils.OneWeek) - 1;
                                      
                            for(var i = 0; i < weeks; i++) {
                              for (var key in elDeviceData.activeHours) {
                                 for(var j = 0; j < elDeviceData.activeHours[key].length; j++){
                                    data.push(elDeviceData.activeHours[key][j]);
                                 }                                  
                               }   
                                                      
                            }
                            return data;

                        }).bind(this)(),
                        step: 'left'
                    }]

            });
        },
       
        

    });
})(window.SH = window.SH || {}, Mustache);