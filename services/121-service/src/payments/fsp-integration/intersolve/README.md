# Intersolve

This readme includes additional information / instructions on use of this FSP, that cannot be deduced from code.

NOTE: Currently the FSP Intersolve, which produces vouchers, is very much intertwined with WhatsApp as a delivery mechanism for delivering these vouchers. In that sense Intersolve is currently a lot more complex than other FSPs. It is on the backlog

## Relevant links / documentation

1. [Twilio portal](https://www.twilio.com/login)

### Use Twilio API during development

See the Twilio API documentation: <https://www.twilio.com/docs>.

- Make sure the `.env` file contains the correct access keys
- Use a tool to inspect the responses from the Twilio API, for example:
  - `ngrok`: <https://ngrok.com>:
    - See also: <https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html>
    - Make sure to use the correct port(`3000`) of the 121-service.
  - `Smee`: <https://smee.io/>
    - You can use the client with:  
      `npx smee -u https://smee.io/<unique-url>`
  - Or any other service that gives a public accessible URL to inspect and/or forward to you local instance of the 121-service.
- Set the ENV-variable `EXTERNAL_121_SERVICE_URL` to your personal url in the [services/.env](../.env)-file.
  - Make sure to run `npm run start:services` after the changes, so the new value(s) will be used.

To also test WhatsApp with Twilio:

- Setup Twilio WhatsApp Sandbox <https://www.twilio.com/docs/whatsapp/sandbox>
- Be sure to join the sandbox with the WhatsApp number you want to test <https://www.twilio.com/docs/whatsapp/sandbox#how-to-join-a-twilio-sandbox>
- Set the callback url for `When a Message Comes in` to `<your-url>/api/notifications/whatsapp/incoming`
