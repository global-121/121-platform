const http = require("http");
const crypto = require("crypto");
const child_process = require("child_process");
const exec = child_process.exec;

// ----------------------------------------------------------------------------
//   Functions/Methods/etc:
// ----------------------------------------------------------------------------

/**
 * Run the deployment script
 * @param {string} target (optional)
 */
function deploy(target) {
  exec(
    target
      ? `cd ${process.env.GLOBAL_121_REPO} && sudo ./tools/deploy.sh "${target}"`
      : `cd ${process.env.GLOBAL_121_REPO} && sudo ./tools/deploy.sh`,
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
    });
    req.on("end", function() {
      let str = Buffer.concat(body).toString();
      let sig =
        "sha1=" +
        crypto
          .createHmac("sha1", process.env.GITHUB_WEBHOOK_SECRET)
          .update(str)
          .digest("hex");
      let payload = JSON.parse(str);

      if (
        req.headers["x-hub-signature"] !== sig ||
        (
          payload.pull_request.merged &&
          payload.pull_request.title.includes("[SKIP CD]")
        )
      ) {
        return
      }

      if (
        process.env.NODE_ENV === "test" &&
        payload.action === "closed" &&
        payload.pull_request.merged
      ) {
        deploy()
        return
      }

      if (
        (
          process.env.NODE_ENV === "production" ||
          process.env.NODE_ENV === "staging"
        ) &&
        payload.action === "released" &&
        payload.release.draft === false &&
        payload.release.target_commitish &&
        payload.release.target_commitish.includes(process.env.VERSION)
      ) {
        deploy(payload.release.target_commitish);
        return
      }
    });
    res.end();
  })
  .listen(process.env.NODE_PORT);

console.log(`Listening on port ${process.env.NODE_PORT}`);
