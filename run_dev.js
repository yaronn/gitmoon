
var cmd = ""
if (process.env.staging) cmd = "_coffee ./common/crunch._coffee; "
cmd +=  "_coffee server._coffee"

var terminal = require('child_process').exec(cmd)

terminal.stdout.on('data', function (data) {
    console.log(data);
});


terminal.stderr.on('data', function (data) {
    console.log(data);
});


terminal.on('exit', function (code) {
        console.log('child process exited with code ' + code);        
});