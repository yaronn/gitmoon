var terminal = require('child_process').exec('npm run-script build; node server.js')

terminal.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
});


terminal.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
});


terminal.on('exit', function (code) {
        console.log('child process exited with code ' + code);        
});