var terminal = require('child_process').exec('_coffee ./common/crunch._coffee; _coffee server._coffee')

terminal.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
});


terminal.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
});


terminal.on('exit', function (code) {
        console.log('child process exited with code ' + code);        
});