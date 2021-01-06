# Tools

This folder contains code not directly related to the applications, but for example documentation of Server Configuration and the setup for Continuous Deployment.

## Contents
* [Hosting](#hosting)
* [Manual Deployment](#manual-deployment)
* [Continuous Deployment](#continuous-deployment)
* [Local development](#local-development)

---

## Hosting

### Apache2

All applications from `/services` folder are running as local applications on various ports of localhost. To expose them to the interfaces, we need Apache2.
Note that not all applications need to be exposed. E.g. UserIMS yes, as it is directly called from PA-app, but e.g. OrgIMS not, because it is called from 121-service, which is called from PA-app. Also the PA-app and the AW-app are served as web-apps through Apache2.

First, get the right certificates (`SSLCertificateFile` and `SSLCACertificateFile`) and place them in `/tools/certificates/`.

On Ubuntu server do: (NOTE the absolute path /home/121-platform, which might be different in your instance)

    ln -s /home/121-platform/tools/121-platform.conf /etc/apache2/sites-enabled/121-platform.conf
    ln -s /home/121-platform/tools/121-platform-https.conf /etc/apache2/sites-enabled/121-platform-https.conf
    a2enmod ssl proxy_http rewrite
    service apache2 restart
    service apache2 status

to check if it started correctly.

---

## Manual Deployment

The bash-script [`deploy.sh`](./deploy.sh) can be run on the test/production-environment to perform all necessary steps.


## Continuous Deployment

### GitHub webhook

A [GitHub webhook](https://developer.github.com/webhooks/) is fired after every merged Pull Request to an endpoint on the server. Upon arrival a script is run. See [`webhook.js`](webhook.js).

This is currently set up. To reproduce, you would follow these steps:

1. Create a `systemd-service`.  
   Use the template [`webhook.service`](webhook.service), fill in:  

   - Set `User` to a user-account with the appropriate permissions.
   - Set `NODE_ENV` to `test` for "Continuous deployment" or `production` for "Releases-only"
   - Set `GLOBAL_121_REPO` to the absolute path of this git-repository
   - Set `GLOBAL_121_WEB_ROOT` to the absolute path of the deployment location of the web-apps
   - Set `GITHUB_WEBHOOK_SECRET` to the value configured on [GitHub](https://github.com/global-121/121-platform/settings/hooks)

2. Install Node.js:  
   See: <https://github.com/nodesource/distributions#installation-instructions> for instructions for Ubuntu.  
   Make sure to install a version higher then `v10`; Preferrably a LTS-release.  
   Verify that the user set-up to run the webhook, has access to this correct version of Node/NPM.

3. Enable the webhook service:

         cp tools/webhook.service /etc/systemd/system/webhook.service
         sudo service webhook start
         sudo service webhook status

4. Expose service with Apache2.  
   See above, [Hosting > Apache2](#apache2).

---

## Local development

### Git-hooks
Some (optional) scripts are in [`git-hooks/`](git-hooks/) to ease running tests before actually committing or pushing.
