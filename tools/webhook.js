const http = require("http");
const crypto = require("crypto");
const child_process = require("child_process");
const exec = child_process.exec;

const secrets = require("./secrets");

// ----------------------------------------------------------------------------
//   Configuration:
// ----------------------------------------------------------------------------

const secret = secrets.secret;
const repo = "/home/121-platform";
const repo_services = `${repo}/services`;
const repo_interfaces = `${repo}/interfaces`;
const repo_pa = `${repo_interfaces}/PA-App`;
const repo_ho = `${repo_interfaces}/HO-Portal`;
const repo_aw = `${repo_interfaces}/AW-App`;
const web_root = "/var/www/121-platform";

// ----------------------------------------------------------------------------
//   Functions/Methods/etc:
// ----------------------------------------------------------------------------

function onMerge() {
  exec(
    `cd ` + repo_services +
    ` && sudo git pull ` +
    ` && sudo docker-compose up -d --build && sudo docker restart 121-service PA-accounts-service` +
    ` && cd ` + repo_pa +
    ` && sudo npm ci --unsafe-perm && sudo npm run build -- --prod --base-href /PA-app/` +
    ` && sudo rm -rf /var/www/121-platform/PA-app && sudo cp -r www/ ${web_root}/PA-app` +
    ` && cd ` + repo_ho +
    ` && sudo npm ci --unsafe-perm && sudo npm run build -- --prod --base-href /HO-portal/` +
    ` && sudo rm -rf /var/www/121-platform/HO-portal && sudo cp -r www/ ${web_root}/HO-portal` + 
    ` && cd ` + repo_aw +
    ` && sudo npm ci --unsafe-perm && sudo npm run build -- --prod --base-href /AW-app/` +
    ` && sudo rm -rf /var/www/121-platform/AW-app && sudo cp -r www/ ${web_root}/AW-app`
  , function(error, stdout, stderr) {
    if (error) {
        console.log(stderr);
    } else {
        console.log(stdout);
    }
  });
}

// ----------------------------------------------------------------------------
//   Webhook Service:
// ----------------------------------------------------------------------------

http
  .createServer(function(req, res) {
    let body = [];
    req.on("data", function(chunk) {
      body.push(chunk);
      console.log("BODY: ", body);
    });
    req.on("end", function() {
      let str = Buffer.concat(body).toString();
      let sig =
        "sha1=" +
        crypto
          .createHmac("sha1", secret)
          .update(str)
          .digest("hex");
      let payload = JSON.parse(str);

      if (
        req.headers["x-hub-signature"] == sig &&
        payload.action == "closed" &&
        payload.pull_request.merged &&
        (
          (payload.pull_request.base.ref == "production" && process.env.NODE_ENV == "production")
          || process.env.NODE_ENV == "staging"
        )
      ) {
        onMerge();
      }
    });
    res.end();
  })
  .listen(3099);

console.log("Listening on port 3099");
