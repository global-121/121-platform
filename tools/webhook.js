const http = require('http');
const crypto = require('crypto');
const child_process = require('child_process');
const fs = require('fs');

const MANUAL_DEPLOY_URL = '?do=deploy';

// ----------------------------------------------------------------------------
//   Functions/Methods/etc:
// ----------------------------------------------------------------------------

/**
 * Run the deployment script
 * @param {string} target (optional)
 */
function deploy(target) {
  let command = `cd ${process.env.GLOBAL_121_REPO} && sudo ./tools/deploy.sh`;
  target = sanitizeTarget(target);

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
    },
  );
}

/**
 * Check whether to deploy/ignore a release
 * @param {string} target
 */
function isPatchUpgrade(target) {
  const currentVersion = fs.readFileSync(
    `${process.env.GLOBAL_121_WEB_ROOT}/VERSION.txt`,
    { encoding: 'utf-8' },
  );
  const currentMinorVersion = currentVersion.replace(
    /v(\d+)\.(\d+)\.([\S\s]*)/,
    'v$1.$2.',
  );

  return target.includes(currentMinorVersion);
}

function showManualDeployForm() {
  return `<!DOCTYPE html>
<meta charset="utf-8">
<title></title>
<form method="POST" action="${MANUAL_DEPLOY_URL}">
<input name="secret" type="password">
<input name="target">
<input type="submit">
</form>`;
}

/**
 * Remove unneccessary characters, return a predictable value
 * @param {string | number} input
 * @returns {string}
 */
function sanitizeTarget(input) {
  if (!input) {
    return '';
  }
  return input.toString().replace(/[^a-z/-_.0-9]/gi, '');
}

// ----------------------------------------------------------------------------
//   Webhook Service:
// ----------------------------------------------------------------------------

if (!process.env.GLOBAL_121_REPO) {
  console.warn(`ENV variable GLOBAL_121_REPO is not defined.`);
  process.exit(1);
}

http
  .createServer((req, res) => {
    if (req.method === 'GET' && req.url.endsWith(MANUAL_DEPLOY_URL)) {
      console.log(`Show manual interface.`);
      res.end(showManualDeployForm());
      return;
    }

    let body = [];
    req.on('data', function (chunk) {
      body.push(chunk);
    });
    req.on('end', function () {
      let strBody = Buffer.concat(body).toString();
      let payload = {};

      if (req.method === 'POST' && req.url.endsWith(MANUAL_DEPLOY_URL)) {
        console.log(`Process manual request`);
        payload = new URL('http://example.org/?' + strBody).searchParams;

        if (payload.get('secret') !== process.env.DEPLOY_SECRET) {
          console.warn('Secret does not match.');
          return;
        }
        let target = sanitizeTarget(payload.get('target'));
        if (!target) {
          console.log(`No valid target.`);
          return;
        }
        console.log(`Manual deployment for: ${target} `);
        deploy(target);
        return;
      }

      if (req.headers['x-hub-signature']) {
        const sig =
          'sha1=' +
          crypto
            .createHmac('sha1', process.env.GITHUB_WEBHOOK_SECRET)
            .update(strBody)
            .digest('hex');

        if (req.headers['x-hub-signature'] !== sig) {
          console.warn('Invalid GitHub signature!');
          return;
        }

        payload = JSON.parse(strBody);
      }

      if (
        payload.pull_request &&
        payload.pull_request.merged &&
        payload.pull_request.title.toUpperCase().includes('[SKIP CD]')
      ) {
        console.log('PR deployment skipped with [SKIP CD]');
        return;
      }

      if (
        process.env.NODE_ENV === 'test' &&
        payload.action === 'closed' &&
        payload.pull_request.merged
      ) {
        console.log('PR deployment for test-environment.');
        deploy();
        return;
      }

      if (
        !!process.env.DEPLOY_PRE_RELEASE &&
        process.env.NODE_ENV === 'production' &&
        payload.action === 'prereleased' &&
        payload.release.draft === false &&
        payload.release.prerelease === true &&
        payload.release.target_commitish
      ) {
        console.log(
          `Pre-release deployment for: ${payload.release.target_commitish}`,
        );
        deploy(payload.release.target_commitish);
        return;
      }

      if (
        !!process.env.DEPLOY_RELEASE &&
        process.env.NODE_ENV === 'production' &&
        payload.action === 'released' &&
        payload.release.draft === false &&
        payload.release.target_commitish &&
        (!!process.env.DEPLOY_PATCH
          ? isPatchUpgrade(payload.release.target_commitish)
          : true)
      ) {
        console.log(
          `Release (hotfix) deployment for: ${payload.release.target_commitish}`,
        );
        deploy(payload.release.target_commitish);
        return;
      }
    });
    res.end();
  })
  .listen(process.env.NODE_PORT);

console.log(`Listening on port ${process.env.NODE_PORT}`);
