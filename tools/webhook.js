var secret = "plukuwplan1";
var repo_services = "/home/121-platform/services";
var repo_pa = "/home/121-platform/interfaces/PA-App";

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
                        'cd ' + repo_services +
                        ' && sudo git pull ' +
                        ' && sudo docker-compose up -d --build' +
			' && cd ' + repo_pa +
			' && sudo npm ci --unsafe-perm && sudo npm run build -- --prod' +
			' && sudo rm -rf /var/www/121-platform/PA-app && sudo cp -r www/ /var/www/121-platform/PA-app'
                , function(error, stdout, stderr) {
                if (error) {
                        console.log(stderr);
                } else {
			console.log('Execution completed');
                        console.log(stdout);
                }
            });
        }
    });
    res.end();
}).listen(3099);

console.log('Listening on port 3099');
