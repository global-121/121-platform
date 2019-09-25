var secrets = require("./secrets");

var secret = secrets.secret;
var repo = "/home/121-platform/services";

let http = require('http');
let crypto = require('crypto');
const exec = require('child_process').exec;

http.createServer(function (req, res) {
    let body = [];
    req.on('data', function(chunk) {
        body.push(chunk);
        console.log('BODY: ',body);
    });
    req.on('end', function() {
        let str = Buffer.concat(body).toString();
        let sig = "sha1=" + crypto.createHmac('sha1', secret).update(str).digest('hex');
        let payload = JSON.parse(str);

        if (req.headers['x-hub-signature'] == sig && payload.action == 'closed' && payload.pull_request.merged) {
            exec(
                        'cd ' + repo +
                        ' && sudo git pull ' +
                        ' && sudo docker-compose up -d --build'
                , function(error, stdout, stderr) {
                if (error) {
                        console.log(stderr);
                } else {
                        console.log(stdout);
                }
            });
        }
    });
    res.end();
}).listen(3099);

console.log('Listening on port 3099');