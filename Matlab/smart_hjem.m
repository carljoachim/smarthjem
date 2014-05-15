clc
warning off

if(exist('t') == 1)
    fclose(t); 
    delete(t); 
    clear t;  
end

t = tcpip('localhost', 8000); 

t.OutputBufferSize = 80000;
t.InputBufferSize = 80000;
t.BytesAvailableFcnMode = 'terminator';
t.BytesAvailableFcn = @runSimulation;

fopen(t);
fprintf(t, '1');
fprintf(t,'Hello from Matlab');
