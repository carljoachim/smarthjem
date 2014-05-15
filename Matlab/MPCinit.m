
function [Req, c, C_heater, Mdot, M, T_init, amp, ComfortTemp] = MPCinit(data)
 

    %% Definer konstandene i den termiske modellen av huset

%% Problem konstanter

    % Husets geometri:
    lenHouse = 20; 
    widHouse = 10; 
    htHouse = 3; 
    pitRoof = 40*pi/180; 
    numWindows = 4; 
    htWindows = 1; 
    widWindows = 1; 
    
    %Beregn totalt areal av vegg/tak og vinduer
    windowArea = numWindows*htWindows*widWindows;
    wallArea = 2*lenHouse*htHouse + 2*widHouse*htHouse + 2*(1/cos(pitRoof/2))*widHouse*lenHouse + tan(pitRoof)*widHouse - windowArea;
    
    % Definer isolasjonsekenskapene til boligen:
    % k har enhet J/sek/m/C. Multipliser med 3600 for ? f? enhet i timer
    % Vegger med isolering, 0,25 m tykk, k = 0,03.
    kWall = 0.03*3600; 
    LWall = 0.25;
    K_wall =(kWall*wallArea)/LWall;
    % Vinduer, 0.04 m tykke, k = 0,7
    kWindow = 0.7*3600;
    LWindow = 0.04;
    K_window = (kWindow*windowArea)/LWindow;
    
    % Beregn total varmetapstall:
    K_eq = K_wall + K_window;
    Req = 1/K_eq;
    
    % Spesifikk varmekapasitet til luft (J/kg-K)
    c = 1005.4; 

    %Temperatur?kning av oppvarmet luft
    C_heater = 20;

    % Hastighet luft oppvarmes = 0.2 kg/sek = 3600*0.2 kg/t
    Mdot = 3600*0.2; 

    %Beregn total masse av luft i boligen
    densAir = 1.2250; % Lufttetthet ved havniv? (kg/m^3)
    M = (lenHouse*widHouse*htHouse+tan(pitRoof)*widHouse*lenHouse)*densAir;

    

    
    %% Hent instillinger fra bruker

    for i = 1:1: length(data.WeatherData)
        WeatherData(i) = str2double(data.WeatherData(i));
    end

    for i = 1:1: length(data.PowerPrices)
        PowerPrices(i) = cell2mat(data.PowerPrices(i));  
    end

    for i = 1:1: length(data.ActivityList)
        ActivityList(i) = str2double(data.ActivityList(i));  
    end
    
    ComfortTemp = str2double(data.ComfortTemp);     
    averageTemp = (ComfortTemp+ActivityList(1))/2;
    T_init = averageTemp;
     
    
    %% Gj?r om til riktig format til MPC

    horizon = 2; % Prediksjonshorisont (t)
    delta = 5/60; % Tidssteg i diskret modell (t)
    n = horizon/delta; % antall tidssteg i prediksjonshorisonten

    time = clock; % N?v?rende dato og klokkeslett
    min = time(5); % Antall min over forrige hele time
    hour = 1;
    
    hoursToSimulate = data.HoursToSimulate; 
    
    for i=0:1:(hoursToSimulate*60) %antall minutter i simulering
        
        estimertUteT(1,i+1) = i/60;
        estimertPris(1,i+1) = i/60;
        tidsplan(1,i+1) = i/60;

        d = min;
        h = hour;
        for j=2:1:n+1
            estimertUteT(j,i+1) = WeatherData(h);
            estimertPris(j,i+1) = PowerPrices(h);
            tidsplan(j,i+1) = ActivityList(h);

            d = d + delta*60;       

            if (d > 60)
                h = h + 1;
                d = d-60;
            end
        end

        min = min + 1;
        if (min > 60)
            hour = hour + 1;
            min = min-60;
        end

    end
    
    amp = data.Weighting;
    
 
    
    %% Lagre i fil
    save estimertUteT.mat estimertUteT;
    save estimertPris.mat estimertPris;
    save tidsplan.mat tidsplan;

end





 