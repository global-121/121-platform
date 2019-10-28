# Tools

This folder contains code not directly related to the applications, but for example documentation of Server Configuration and the setup for Continuous Deployment.

## Contents
* [Hosting](#hosting)
* [Deployment](#deployment)
* [Local development](#local-development)

---

## Hosting

### Apache2

All applications from /services folder are running as local applications on various ports of localhost. To expose them to be reached by frontend-apps, we need Apache2.
Note that not all applications need to be exposed. E.g. UserIMS yes, as it is directly called from PA-app, but e.g. OrgIMS not, because it is called from 121-service, which is called from PA-app. Also the PA-app and the AW-app are served as web-apps through Apache2.

First, get the right certificates (SSLCertificateFile and SSLCACertificateFile) and place them in /tools/certificates/.

On Ubuntu server do:

    cp tools/121-platform.conf /etc/apache2/sites-enabled/121-platform.conf
    cp tools/121-platform-https.conf /etc/apache2/sites-enabled/121-platform-https.conf
    a2enmod ssl
    service apache2 restart
    service apache2 status

to check if it started correctly.

---

## Deployment

### GitHub webhook

A [GitHub webhook](https://developer.github.com/webhooks/) is fired after every merged Pull Request to an endpoint on the server. Upon arrival a script is run. In this case it pulls the latest code, and starts `docker-compose` to rebuild and recreate and restart all containers.

This is currently set up. To reproduce, you would follow these steps:

1. (On the Ubuntu server) copy secrets file

    cp tools/secrets.json.example tools/secrets.json

   And fill in the right secret.

2. Create `systemd-service`. First fill in the right User in `webhook.service`. This should reflect a user-account on that server with the appropriate permissions.

    cp tools/webhook.service /etc/systemd/system/webhook.service
    sudo service webhook start
    sudo service webhook status

   The last command checks that the service runs correctly.

3. Expose service with Apache2. (This was already done above / is the same.)

    cp tools/121-platform.conf /etc/apache2/sites-enabled/121-platform.conf
    service apache2 restart
    service apache2 status

   To check if it started correctly.

---

## Local development

### Git-hooks
Some (optional) scripts are in [`git-hooks/`](git-hooks/) to ease running tests before actually committing or pushing.
