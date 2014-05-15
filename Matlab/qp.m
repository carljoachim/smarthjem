function qp2(block)

  setup(block);
  
end
  

function setup(block)

   %% Antall inngang- og utgangsporter til blokken 
  block.NumInputPorts  = 6;
  block.NumOutputPorts = 1;

  %% 
  block.SetPreCompInpPortInfoToDynamic;
  block.SetPreCompOutPortInfoToDynamic;
  
  block.InputPort(1).dimensions = 24;
  block.InputPort(2).dimensions = 24;
  block.InputPort(3).dimensions = 24;
  block.InputPort(4).dimensions = 1;
  block.InputPort(5).dimensions = 1;
  block.InputPort(6).dimensions = 1;
    
  block.OutputPort(1).dimensions = 1;

  %% Sett samplingsintervallet
  %block.SampleTimes = [1/60 0];
  block.SampleTimes = [5/60 0];
  
  %% Sette simStateCompliance til default
  block.SimStateCompliance = 'DefaultSimState';

  %% Kj?re akselerator p? TLC
  block.SetAccelRunOnTLC(true);
  
  %% Register methods  
  block.RegBlockMethod('PostPropagationSetup', @DoPostPropSetup);
  block.RegBlockMethod('InitializeConditions', @InitializeConditions);
  block.RegBlockMethod('Outputs', @Output);  

  
end

function DoPostPropSetup(block)

  block.NumDworks = 2;

  block.Dwork(1).Name            = 'T_prev';
  block.Dwork(1).Dimensions      = 1;
  block.Dwork(1).DatatypeID      = 0; % double
  block.Dwork(1).Complexity      = 'Real'; 
  block.Dwork(1).UsedAsDiscState = false;
  
  block.Dwork(2).Name            = 'eps';
  block.Dwork(2).Dimensions      = 1;
  block.Dwork(2).DatatypeID      = 0; % double
  block.Dwork(2).Complexity      = 'Real'; 
  block.Dwork(2).UsedAsDiscState = false;
  
end

function InitializeConditions(block)
    %% Initialverdier til Dwork variablene

    block.Dwork(1).Data = 20;
    block.Dwork(2).Data = 0;

end

function Output(block)
    %% MPC
    
    %% Ta imot inngangsvardiene
    B2_raw = block.InputPort(1).Data; % Tidsplan over temperaturkrav
    T_out_raw = block.InputPort(2).Data; % Forventet utetemperaturer -> fra v?rmelding
    P_raw = block.InputPort(3).Data; % Forventet pris for 1kwh
    T0 = block.InputPort(4).Data; % Initialverdi, fra termometer i huset (Celsius)
    T_comf = block.InputPort(6).Data; % Komforttemperatur n?r bruker er tilstede
    
    %% Hent Dwork verdiene
    T_prev = block.Dwork(1).Data;
    eps = block.Dwork(2).Data;

    %% Sett tidshorisont og diskretiseringsintervall
    N = 2; % (t)
    delta = 5/60; % (t)
    
    %n = N/delta; % antall tidssteg i prediksjonshorisonten (uten input blokkering)
    
    %% Input blokkering
    
    %Definer to ulike intervallsteg:
    delta1 = delta;
    delta2 = delta*2; 
    
   %Del opp tidskorisonten i to deler:
    N1 = N/2;
    N2 = N/2;
    
    %Beregn antall tidsinstanser i de to delene av tidshorisonten:
    n1 = N1/delta1; 
    n2 = N2/delta2; 
   
    n = n1 + n2; % Totalt antall tidsinstanser 
    
    %Vektor med diskretiseringsintervall
    for i = 1:1:n
        if(i < n1)
            Delta(1,i) = delta1;
        elseif(i >= n1)
            Delta(1,i) = delta2;
        end
    end
    
    %Reduser lengden p? vektorene ved ? plukke ut elementer
    d = delta1/delta1;
    m = 0;
    for i = 1:1:n
        if (i > n1)
            d = delta2/delta1;
        end
        
        m = m+d;
        
        T_out(i) = T_out_raw(m);
        P(i) = P_raw(m);
        B2(i) = - B2_raw(m);    

    end
    
    B2(end) = - B2_raw(end);
    P(end) = P_raw(end);
    T_out(end) = T_out_raw(end);
   
   

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
    
    % Spesifikk varmekapasitet til luft (J/kg-K)
    c = 1005.4; 

    %Temperatur?kning av oppvarmet luft
    THeater = 20;

    % Hastighet luft oppvarmes = 0.2 kg/sek = 3600*0.2 kg/t
    Mdot = 3600*0.2;  % hour is the time unit

    %Beregn total masse av luft i boligen
    densAir = 1.2250; % Lufttetthet ved havniv? (kg/m^3)
    M = (lenHouse*widHouse*htHouse+tan(pitRoof)*widHouse*lenHouse)*densAir;
    
    %% Integralvirkning
   
    err = (T0 - T_prev)/Delta(1); % Feil mellom estimet temp og m?lt temp etter ett samplingsintervall
    Err = (err + eps)*Delta';
    
    %% Likhetsbegrensninger (med input blokkering)

    k11 = (delta1*K_eq)/(M*c) - 1;
    k21 = -(THeater*Mdot*delta1)/M;
    
    k12 = (delta2*K_eq)/(M*c) - 1;
    k22 = -(THeater*Mdot*delta2)/M; 

    Aeq1 = [zeros(1,n); k11*eye(n1-1) zeros(n1-1,n2+1); zeros(n2,n1-1) k12*eye(n2) zeros(n2,1);] + eye(n);
    Aeq2 = [k21*eye(n1) zeros(n1,n2); zeros(n2,n1) k22*eye(n2);];
    

    Beq(1,1) = -k11*T0 + delta1*T_out(1)*K_eq/(M*c);
    for i = 2:1:n
        if(i < n1)
            Beq(i,1) = delta1*T_out(i)*K_eq/(M*c);
        elseif(i >= n1)
            Beq(i,1) = delta2*T_out(i)*K_eq/(M*c);
        end
    end
    
    Beq = Beq + Err; % Integralvirkning - Korrigerer for feil
    
    %% Ulikhetsbegrensninger
    
    I = eye(n);
    I0 = zeros(n,n);
    
    A = [I I0 I0;
        -I I0 I0;
        I0 I0 -I;
        I0 I0 I;];
    
    B1 = (T_comf+1)*ones(1,n); % ?vre grense for komforttemperatur settes til T_comf+1.
    B3 = zeros(1,n); % Nedre grense for input -> 0 = av
    B4 = ones(1,n); % ?vre grense for input -> 1 = p?
    
    B = [B4 B3 B2 B1];
    
    %% Vektingsmatriser
    
    ampH = 1;
    ampR = 1000;
    
    if (block.InputPort(5).Data < 0)
        ampR = -ampR*10*block.InputPort(5).Data;
    elseif (block.InputPort(5).Data > 0)
        ampH = ampH*10*block.InputPort(5).Data;
    end
    

    %% Formuler matrisene til objektivfunksjonen
    
    ampS = 0; %0.001*ampR; 
    
    s = zeros(n,n);
    s(1,:) = [1/Delta(1) -1/Delta(1) zeros(1,n-2)];
    for i = 2:1:n-1
        s(i,:) = [zeros(1,i-2) -1/Delta(i-1) (1/Delta(i-1)+1/Delta(i)) -1/Delta(i) zeros(1,n-i-1)];
    end
    s(n,:) = [zeros(1,n-2) -1/Delta(n) 1/Delta(n)];
    S = [s zeros(n,n); zeros(n,2*n);];
    
    R = ampR*diag((Delta.*P).^2);
    H = ampH*[I -I; -I I;] + ampS*S;
    
    Q = [R zeros(n, 2*n);
        zeros(2*n, n) H;];
    
    %% Mixed integer progammering (Kommenter ut ved bruk av quadprog!)

%     Tk = sdpvar(n,1);
%     T = sdpvar(n,1);
%     u = binvar(n,1);
%     
%     objective = [u' T' Tk']*Q*[u; T; Tk;];
%     
%     con1 = -B2' <= Tk <= B1';
%     con2 = Aeq1*T + Aeq2*u == Beq;
%     
%     ops = sdpsettings ('verbose', 1, 'debug', 1, 'solver', 'bnb');
%     ops.bnb.maxiter = 100000;
% 
%     solvesdp([con1,con2],objective, ops);
%     
%     U = double(u);
%     output = U(1);
%     T_est = double(temp(1));
%   

    %% Kvadratisk programmering (Kommenter ut ved bruk av mixed integer!)
    
    AeqQP = [Aeq2 Aeq1 I0];
  
    opts1 = optimset('Algorithm','interior-point-convex', 'Display','off');
  
    [q fval eflag] = quadprog(Q,[],A,B,AeqQP,Beq,[],[],[],opts1);
    
    output = q(1);
    T_est = q(n+1);
    
    %% Lagre error og estimert T, send ut p?drag
    
    block.Dwork(1).Data = T_est;
    block.Dwork(2).Data = eps + err;
    
    block.OutputPort(1).Data = output;
    
end
