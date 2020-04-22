const http = require("http");
const crypto = require("crypto");
const child_process = require("child_process");
const exec = child_process.exec;

const secrets = require("./secrets");

const secret = secrets.secret;
const repo = process.env.GLOBAL_121_REPO;


// ----------------------------------------------------------------------------
//   Functions/Methods/etc:
// ----------------------------------------------------------------------------

/**
 * Run the deployment script
 * @param {string} target (optional)
 */
function deploy(target) {
  exec(
    `cd ${repo} && sudo ./tools/deploy.sh` + (target) ? ` ${target}` : ``,
    function (error, stdout, stderr) {
      if (error) {
        console.log(stderr);
      } else {
        console.log(stdout);
      }
    }
  );
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
        req.headers["x-hub-signature"] !== sig
      ) {
        return
      }
      if (
        process.env.NODE_ENV === "staging" &&
        payload.action === "closed" &&
        payload.pull_request.merged
      ) {
        deploy()
        return
      }
      if (
        process.env.NODE_ENV === "production" &&
        payload.release.target_commitish &&
        payload.release.target_commitish.includes(process.env.VERSION)
      ) {
        deploy(payload.release.target_commitish);
        return
      }
    });
    res.end();
  })
  .listen(3099);

console.log("Listening on port 3099");
