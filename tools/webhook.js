const http = require("http");
const crypto = require("crypto");
const child_process = require("child_process");
const exec = child_process.exec;
const execSync = child_process.execSync;

const secrets = require("./secrets");

const secret = secrets.secret;
const repo = "/home/121-platform";
const repo_services = `${repo}/services`;
const repo_interfaces = `${repo}/interfaces`;
const repo_pa = `${repo_interfaces}/PA-App`;
const repo_ho = `${repo_interfaces}/HO-Portal`;
const repo_aw = `${repo_interfaces}/AW-App`;
const web_root = "/var/www/121-platform";

function logOutput(error, stdout, stderr) {
  if (error) {
    return console.error(stderr);
  }

  console.log(stdout);
}

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
        payload.pull_request.merged
      ) {
        // Update local state
        execSync(`echo "Update local state:" && sudo git pull`, {
          cwd: repo
        });

        // Build PA-App
        exec(
          `echo "Build PA-App:" ` +
            ` && sudo npm ci --unsafe-perm ` +
            ` && sudo npm run build -- --prod --base-href /PA-app/ ` +
            ` && sudo rm -rf ${web_root}/PA-app ` +
            ` && sudo cp -r www/ ${web_root}/PA-app `,
          {
            shell: true,
            stdio: "inherit",
            cwd: repo_pa,
            env: {
              NG_SUB_DIR_PATH: "/PA-app"
            }
          },
          function(error, stdout, stderr) {
            console.log("Built PA-App");
            logOutput(error, stdout, stderr);
          }
        );

        // Build AW-App
        exec(
          `echo "Build AW-App:" ` +
            `&& sudo npm ci --unsafe-perm ` +
            `&& sudo npm run build -- --prod --base-href /AW-app/ ` +
            `&& sudo rm -rf ${web_root}/AW-app ` +
            `&& sudo cp -r www/ ${web_root}/AW-app `,
          {
            shell: true,
            stdio: "inherit",
            cwd: repo_aw,
            env: {
              NG_SUB_DIR_PATH: "/AW-app"
            }
          },
          function(error, stdout, stderr) {
            console.log("Built AW-App");
            logOutput(error, stdout, stderr);
          }
        );

        // Build HO-Portal
        exec(
          `echo "Build HO-Portal:" ` +
            `&& sudo npm ci --unsafe-perm ` +
            `&& sudo npm run build -- --prod --base-href /HO-portal/ ` +
            `&& sudo rm -rf ${web_root}/HO-portal ` +
            `&& sudo cp -r www/ ${web_root}/HO-portal `,
          {
            shell: true,
            stdio: "inherit",
            cwd: repo_ho
          },
          function(error, stdout, stderr) {
            console.log("Built HO-Portal");
            logOutput(error, stdout, stderr);
          }
        );

        // Build services
        exec(
          `echo "Build services:" && sudo docker - compose up - d--build `,
          {
            shell: true,
            stdio: "inherit",
            cwd: repo_services
          },
          function(error, stdout, stderr) {
            console.log("Built services");
            logOutput(error, stdout, stderr);
          }
        );
      }
    });
    res.end();
  })
  .listen(3099);

console.log("Listening on port 3099");
