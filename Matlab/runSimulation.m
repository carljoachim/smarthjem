function data = runSimulation(obj,~)
    data = fscanf(obj);
    
    if(data(1) == '{' && data(2) == '"')    
        data = JSON.parse(data);
        timeToSimulate = data.HoursToSimulate;
        [K_eq, c, C_heater, Mdot, M, T_init, amp, ComfortTemp] = MPCinit(data);
        options = simset('SrcWorkspace','current');          
        fprintf('Startet ny simulering - Vennligst vent...\n');        
        [t, x, y] = sim('MPC', timeToSimulate, options);
        fprintf('Ferdig med simulering!\n');              
        testTemp = [t';  x(:,1)';];  
        temp = mat2str(testTemp, 4); 
        cost = num2str(x(end,2));
        returnString = strcat(temp, ',' ,cost, 'X');   
        fprintf(obj, returnString);  
    end 
end

