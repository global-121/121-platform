const http = require("http");
const crypto = require("crypto");
const child_process = require("child_process");
const exec = child_process.exec;

const secrets = require("./secrets");

// ----------------------------------------------------------------------------
//   Configuration:
// ----------------------------------------------------------------------------

const secret = secrets.secret;


// ----------------------------------------------------------------------------
//   Functions/Methods/etc:
// ----------------------------------------------------------------------------

function deploy(tag_name) {
  exec(
    `. ./deploy.sh`,
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
        payload.release.tag_name &&
        payload.release.tag_name.startsWith(process.env.VERSION)
      ) {
        deploy(payload.release.tag_name);
        return
      }
    });
    res.end();
  })
  .listen(3099);

console.log("Listening on port 3099");
