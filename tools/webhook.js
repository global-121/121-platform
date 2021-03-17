const http = require("http");
const crypto = require("crypto");
const child_process = require("child_process");
const fs = require("fs");

// ----------------------------------------------------------------------------
//   Functions/Methods/etc:
// ----------------------------------------------------------------------------

/**
 * Run the deployment script
 * @param {string} target (optional)
 */
function deploy(target) {
  let command = `cd ${process.env.GLOBAL_121_REPO} && sudo ./tools/deploy.sh`;

  if (target) {
    command += ` "${target}"`;
  }

  child_process.exec(
    command,
    {
      maxBuffer: 10 * 1024 * 1024,
    },
    function (error) {
      if (error) {
        console.error(error);
        return;
      }
    }
  );
}

/**
 * Check whether to deploy/ignore a release
 * @param {string} target
 */
function isPatchUpgrade(target) {
  const currentVersion = fs.readFileSync(`${process.env.GLOBAL_121_WEB_ROOT}/VERSION.txt`, { encoding: 'utf-8' });
  const currentMinorVersion = currentVersion.replace(/v(\d+)\.(\d+)\.([\S\s]*)/, 'v$1.$2.');

  return target.includes(currentMinorVersion);
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

      if (req.headers["x-hub-signature"] !== sig) {
        console.warn('Invalid GitHub signature!');
        return
      }

      if (
        payload.pull_request &&
        payload.pull_request.merged &&
        payload.pull_request.title.includes("[SKIP CD]")
      ) {
        console.log('PR deployment skipped with [SKIP CD]');
        return
      }

      if (
        process.env.NODE_ENV === "test" &&
        payload.action === "closed" &&
        payload.pull_request.merged
      ) {
        console.log('PR deployment for test-environment.');
        deploy()
        return
      }

      if (
        process.env.NODE_ENV === "production" &&
        payload.action === "released" &&
        payload.release.draft === false &&
        payload.release.target_commitish &&
        isPatchUpgrade(payload.release.target_commitish)
      ) {
        console.log(`Release (hotfix) deployment for: ${payload.release.target_commitish}`);
        deploy(payload.release.target_commitish);
        return
      }
    });
    res.end();
  })
  .listen(process.env.NODE_PORT);

console.log(`Listening on port ${process.env.NODE_PORT}`);
