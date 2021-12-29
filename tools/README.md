# Tools

This folder contains code not directly related to the applications, but for example documentation of Server Configuration and the setup for Continuous Deployment.

## Contents

- [Hosting](#hosting)
- [Manual Deployment](#manual-deployment)
- [Continuous Deployment](#continuous-deployment)
- [Local development](#local-development)

---

## Hosting

### Apache2

All applications from `/services` folder are running as local applications on various ports of localhost. To expose them to the interfaces, we need Apache2.

All the interfaces are served as web-apps through Apache2.

First, get the right certificates (`SSLCertificateFile` and `SSLCACertificateFile`) and place them in `/tools/certificates/`.

On Ubuntu server do: (NOTE the absolute path /home/121-platform, which might be different in your instance)

    ln -s /home/121-platform/tools/121-platform.conf /etc/apache2/sites-enabled/121-platform.conf
    ln -s /home/121-platform/tools/121-platform-https.conf /etc/apache2/sites-enabled/121-platform-https.conf
    a2enmod ssl proxy proxy_http http2 rewrite headers expires mime dir
    service apache2 restart

To check if it started correctly:

    service apache2 status

---

## Maintenance mode

The above configuration of [Apache2](#apache2) includes to return a "503 Service Unavailable" or "maintenance message" response when a `.maintenance`-file exists.

This is automatically used during deployment of the back-end services (see [`deploy.sh`](./deploy.sh)), but can also be turned on/off manually.

Where `<webroot-path>` is for example: `/var/www/121-platform/`;

- To turn on: (create the file)  
  `touch <webroot-path>/.maintenance`
- To turn off: (remove the file)  
  `rm <webroot-path>/.maintenance`

## Manual Deployment

The bash-script [`deploy.sh`](./deploy.sh) can be run on the test/production-environment to perform all necessary steps.  
For all available options, run: `deploy.sh --help`

## Continuous Deployment

### Webhook Script

A Webhook script is run on our server(s) to respond to events in our GitHub-repository. See [`webhook.js`](webhook.js).

The Webhook script responds to [GitHub webhook](https://developer.github.com/webhooks/)-payloads depending on the feature-flags set via ENV-variables or depending on the specific event/action provided by GitHub, for example "when a Pull-Request is merged" or "when a Release is published".

The features/flags are:

- If `DEPLOY_PRE_RELEASE=1` is set, every _**pre**-release_ published on GitHub will be automatically deployed.
- If `DEPLOY_RELEASE=1` is set, every _release_ published on GitHub will be automatically deployed.
- If `DEPLOY_PATCH=1` is set, every **hotfix/patch**-release published on GitHub will be automatically deployed ONLY if its version-number is of the same _minor_ version. (So `v1.2.1` will be deployed automatically ONLY when the current version is `v1.2.0`.)

There is also a 'manual override', when going to the webhook's public endpoint in a browser with the URL `?do=deploy`. In the form the `DEPLOY_SECRET` and the target branch can be submitted to run the deploy-script with the code from that branch.

Our current set-up is:

1.  Create a `systemd-service`.  
    Use the template [`webhook.service`](webhook.service), fill in:

    - Set `User` to a user-account with the appropriate permissions.
    - Set `NODE_ENV` to `test` for "Continuous deployment" or `production` for "Releases-only"
    - Set `GLOBAL_121_REPO` to the absolute path of this git-repository
    - Set `GLOBAL_121_WEB_ROOT` to the absolute path of the deployment location of the web-apps
    - Set `GITHUB_WEBHOOK_SECRET` to the value configured on [GitHub](https://github.com/global-121/121-platform/settings/hooks)
    - Set `DEPLOY_SECRET` to a secure secret value stored elsewhere (i.e. Bitwarden)
    - Set or remove the preferred flags of `DEPLOY_PATCH`, `DEPLOY_PRE_RELEASE` and/or `DEPLOY_RELEASE`.

2.  Install Node.js:  
    See: <https://github.com/nodesource/distributions#installation-instructions> for instructions for Ubuntu.  
    Make sure to install a version higher then `v10`; Preferably a LTS-release.  
    Verify that the user set-up to run the webhook, has access to this correct version of Node/NPM.

3.  Enable the webhook service:

         cp tools/webhook.service /etc/systemd/system/webhook.service
         sudo service webhook start
         sudo service webhook status

4.  Expose the webhook service with Apache.  
    See above, [Hosting > Apache2](#apache2).

---

## Local development

### Git-hooks

Some (optional) scripts are in [`git-hooks/`](git-hooks/) to ease running tests before actually committing or pushing.
