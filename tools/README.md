# Tools

This tools-folder contains code not directly related to the applications, but for example to Server Configuration and Continuous Deployment.

---

## Apache2

All applications from /services folder are running as local applications on various ports of localhost. To expose them to be reached by frontend-apps, we need Apache2.
Note that not all applications need to be exposed. E.g. UserIMS yes, as it is directly called from PA-app, but e.g. OrgIMS not, because it is called from 121-service, which is called from PA-app.

On Ubuntu server do:

    cp tools/121-platform.conf /etc/apache2/sites-enabled/121-platform.conf
    service apache2 restart
    service apache2 status

to check if it started correctly.

---

## Git webhook

A Git webhook is fired after every merged Pull Request to an endpoint on the server. Upon arrival a script is run, which can perform steps. In this case it pulls the latest code, and starts docker-compose to rebuild and recreate and restart all containers.

This is currently set up. To reproduce, you would follow these steps:
1. (On the Ubuntu server) copy secrets file

    cp tools/secrets.json.example tools/secrets.json

and fill in the right secret.

2. Create systemd-service. First fill in the right User in webhook.service. This should reflect a user-account on that server with the appropriate permissions.

    cp tools/webhook.service /etc/systemd/system/webhook.service
    sudo service webhook start
    sudo service webhook status

The last command checks that the service runs correctly.

3. Expose service with Apache2. (This was already done above / is the same.)

    cp tools/121-platform.conf /etc/apache2/sites-enabled/121-platform.conf
    service apache2 restart
    service apache2 status

to check if it started correctly.

