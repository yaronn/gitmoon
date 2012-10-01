var terminal = require('child_process').exec('_coffee server._coffee')

terminal.stdout.on('data', function (data) {
    console.log(data);
});


terminal.stderr.on('data', function (data) {
    console.log(data);
});


terminal.on('exit', function (code) {
        console.log('child process exited with code ' + code);        
});