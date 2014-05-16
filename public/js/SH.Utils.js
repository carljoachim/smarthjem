(function($){
    var SH = window.SH = window.SH || {};
    SH.Utils = SH.Utils || {};

      SH.Utils.OneDay = 3600000 * 24;
      SH.Utils.OneWeek = 604800000;
      SH.Utils.OneHour = 3600000;	
      SH.Utils.HoursInDay = 24;

      SH.Utils.parseFile = function(data){
          var datePrices = [];

          var csvDataJson = $.parse(data, {
              delimiter: ";",
              header: false,
              dynamicTyping: true
          });

          for(var i = 0; i < csvDataJson.results.length; i++){
              var date = "";
              var prices = [];

              if(csvDataJson.results[i].length == 34){                
                  for (var j = 1; j < 25; j++) {                       

                      if(csvDataJson.results[i][j] != ""){        

                          var hourPrice = parseFloat(csvDataJson.results[i][j]) / 1000;   
                          date = csvDataJson.results[i][0];

                          prices.push(hourPrice);
                      }
                  };

                  datePrices.push({date: date, prices: prices});
              }
          }
          return datePrices;
      }; 

      SH.Utils.parseWeatherFile = function(){
         $.ajax({
              type: "GET",
              url: "http://api.openweathermap.org/data/2.5/forecast/daily?q=Trondheim&cnt=7&mode=json&units=metric&APPID=1600a7b47cbaa3b06eb32acc5c00c563",
              dataType: "json",   
              success: successFunc, 
              error: function(){
                console.log("fail weather");
              }     
          });
      };   
      
      successFunc = function(data){
        var hourTemperatures = [];
        for(var i = 0; i < data.list.length; i++){
              hourTemperatures.push(data.list[i].temp.night);  
              hourTemperatures.push(data.list[i].temp.morn);  
              hourTemperatures.push(data.list[i].temp.day);  
              hourTemperatures.push(data.list[i].temp.eve);                         
          }

          var extracted = extractTemperatures(hourTemperatures)

          window.weekForecast = extracted;

      };

      linearFunction = function(y1, y2){
          var returnArray = [];
          var dt = 6;

          var a = (y2 - y1) / dt;
         
          for (var i = 0; i < dt; i++) {
                returnArray.push((a * i + y1).toFixed(2));
          };  

          return returnArray;
      };

      extractTemperatures = function(hourTemperatures){
          var returnTable = [];
          
          for (var i = 0; i < hourTemperatures.length; i++) {

             if(!isNaN(hourTemperatures[i+1])){
                 var linear = linearFunction(hourTemperatures[i], hourTemperatures[i+1]);

                 returnTable = returnTable.concat(linear);    
             }
       
           };
                
          return returnTable;         
      }

      SH.Utils.elUsageTime = function(elObject){

           var monList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
           for (var i = 0; i < elObject.days.mon.length; i++) monList.splice(elObject.days.mon[i], 1, elObject.effect);   
           elObject.days.mon = monList;

          var tueList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
           for (var i = 0; i < elObject.days.tue.length; i++) tueList.splice(elObject.days.tue[i], 1, elObject.effect);            
           elObject.days.tue = tueList;

          var wedList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
           for (var i = 0; i < elObject.days.wed.length; i++) wedList.splice(elObject.days.wed[i], 1, elObject.effect);            
           elObject.days.wed = wedList;

          var thuList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
           for (var i = 0; i < elObject.days.thu.length; i++) thuList.splice(elObject.days.thu[i], 1, elObject.effect);            
           elObject.days.thu = thuList;

          var friList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
           for (var i = 0; i < elObject.days.fri.length; i++) friList.splice(elObject.days.fri[i], 1, elObject.effect);            
           elObject.days.fri = friList;

          var satList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
           for (var i = 0; i < elObject.days.sat.length; i++) satList.splice(elObject.days.sat[i], 1, elObject.effect);            
           elObject.days.sat = satList;

          var sunList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
           for (var i = 0; i < elObject.days.sun.length; i++) sunList.splice(elObject.days.sun[i], 1, elObject.effect);            
           elObject.days.sun = sunList;

          return elObject;

        };

     SH.Utils.getPowerPricesFromNowTheNextDays = function(numOfDays){             
        var hourPrices = [];  

        var hours = numOfDays * SH.Utils.HoursInDay + 3;
        var now = new Date();
        var nearestHour = roundDownMinutes(now).getHours();

        start = moment(now).format('DD.MM.YY');
        
        if(window.powerPrices != undefined){ 
            for (var i = 0; i < window.powerPrices.length; i++) {              
               if(window.powerPrices[i].date == start){
                 for (var x = i; x < i + numOfDays + 1; x++) {   
                    for (var j = nearestHour - 1; j < powerPrices[x].prices.length; j++) {
                      if(hourPrices.length < hours) hourPrices.push(powerPrices[x].prices[j])
                      else{
                        break;
                      } 
                    };        
                    nearestHour = 1;            
                 };
              }
            }       
         }else{
            console.log("Må parse strømpriser først");
        }       
        return hourPrices;
     }; 

     SH.Utils.getWeatherForecastTheNextDays = function(numOfDays){       
       var returnForecast = [];
       var currentHours = roundDownMinutes(new Date()).getHours(); 


       for (var i = currentHours; i < currentHours + numOfDays * SH.Utils.HoursInDay + 3; i++) {
          returnForecast.push(window.weekForecast[i]);
       };

       return returnForecast;
     };
    

     sortArrayOfDates = function(date1, date2){
          if (date1.start > date2.start) return 1;
          if (date1.start < date2.start) return -1;
        return 0;
     };
     roundDownMinutes = function(date) {
        date.setHours(date.getHours() + Math.floor(date.getMinutes()/60));
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        return date;
     };
        
     SH.Utils.getActivityList = function(numOfDays, events, comfortTemp, limitTemp){
          var activityList = [];
          var relevantEvents = [];

          events.sort(sortArrayOfDates);
          var now = new Date();
          var startOfDay = now.setHours(0,0,0,0);
          var timeSpan = numOfDays * (SH.Utils.HoursInDay + 3) * SH.Utils.OneHour;
          var nearestHour = roundDownMinutes(new Date()).getTime();  

          var hoursCount = 0;

          while(startOfDay + hoursCount <= nearestHour + timeSpan){            
              for (var i = 0; i < events.length; i++) {
                 if(events[i].start.getTime() == startOfDay + hoursCount){
                      if(events[i].end.getTime() > nearestHour && events[i].start.getTime() <= nearestHour){                                           
                           var hoursToEnd = 0;
                           while(nearestHour + hoursToEnd < events[i].end.getTime()){ 
                              relevantEvents.push(nearestHour + hoursToEnd); 
                              hoursToEnd += SH.Utils.OneHour;
                           }
                        hoursCount = events[i].end.getTime() - startOfDay;
                      }
                      if(events[i].end.getTime() < nearestHour + timeSpan && events[i].start.getTime() > nearestHour){
                        var hoursToEnd = 0;
                        while(startOfDay + hoursCount + hoursToEnd < events[i].end.getTime()){
                           relevantEvents.push(events[i].start.getTime() + hoursToEnd);
                           hoursToEnd += SH.Utils.OneHour;
                        }
                        hoursCount = events[i].end.getTime() - startOfDay;
                      }                      
                      if(events[i].end.getTime() > nearestHour + timeSpan && events[i].start.getTime() > nearestHour){
                        var hoursToEnd = 0;
                        while(startOfDay + hoursCount + hoursToEnd < events[i].end.getTime()){
                           relevantEvents.push(events[i].start.getTime() + hoursToEnd);
                           hoursToEnd += SH.Utils.OneHour;
                        }
                        hoursCount = events[i].end.getTime() - startOfDay;
                      }
                  }
               }
               hoursCount += SH.Utils.OneHour;
           }
                 
          var nearestHour = roundDownMinutes(new Date());          
          var hourCounter = nearestHour.getTime();

         
          while(hourCounter <= nearestHour.getTime() + timeSpan - SH.Utils.OneHour){
              for (var i = 0; i < relevantEvents.length; i++) {             
                 if(relevantEvents[i] == hourCounter){                               
                    activityList.push(comfortTemp);
                    hourCounter += SH.Utils.OneHour;
                    continue;
                 }
              }
              activityList.push(limitTemp);
              hourCounter += SH.Utils.OneHour;
              
          };

          return activityList;
     };



    SH.Utils.parseMatlabString = function(dataString){      
       
        var newString = dataString.replace("[", "").replace("]", "").replace(";", " ").replace(",", " ").replace("\n", "").replace("X", "");
      
        var stringArray = newString.split(" ");
        var nearestHour = new Date().getTime() + SH.Utils.OneHour;

        var cost = parseFloat(stringArray.splice(stringArray.length-1, 1)).toFixed(1);
       
        var returnArray = [];
        
        for (var i = 0; i < stringArray.length/2 - 1; i++) {  
            
            var time = nearestHour + (parseFloat(stringArray[i]) * SH.Utils.OneHour);
            var temp = parseFloat(parseFloat(stringArray[stringArray.length/2 + i]));
      
            returnArray.push([time, temp]);
                       
        };
        
        dataObject = {
          Degrees: returnArray,
          Cost: cost
        }

        return dataObject;
    };






})(jQuery);