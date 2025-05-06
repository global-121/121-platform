# Testing Twilio API during development

## 1. Use a tool to inspect the responses from the Twilio API

- Some options:
  - `ngrok`: <https://ngrok.com>:
    - See also: <https://www.twilio.com/en-us/blog/6-awesome-reasons-to-use-ngrok-when-testing-webhooks-html>
    - Make sure to use the correct port(`3000`) of the 121-service.
  - `Smee`: <https://smee.io/>
    - You can use the client with:  
      `npx smee -u https://smee.io/<unique-url>`
  - Or any other service that gives a public accessible URL to inspect and/or forward to you local instance of the 121-service.
- Setup steps with `ngrok`:
  - Install `ngrok` on your machine, and link to a free public account
  - Run `ngrok http 3000`
- Make note of your publicly accessible URL, for example `https://srkgjh-33-444-88-111.ngrok-free.app`

## 2. Login to the [Twilio console](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn?frameUrl=%2Fconsole%2Fsms%2Fwhatsapp%2Flearn%3Fx-target-region%3Dus1) and link yourself to the sandbox

- Make sure to choose the "development" sub-account from the dropdown menu at the top of the page
- Make note of the `SID` and `AUTHTOKEN`.
  - Refer to these as `TWILIO_SID` and `TWILIO_AUTHTOKEN` in the `.env` later
- From the left menu: go to Messaging > Services and copy the `SID`
  - Refer to this as `TWILIO_MESSAGING_SID` in the `.env` later
- Access the "Sandbox" environment from the left menu: Messaging > Try it out > Send a WhatsApp Message
- Make note of the `WHATSAPP_NUMBER` and then join the conversation with your personal WhatsApp account
  - Refer to this as `TWILIO_WHATSAPP_NUMBER` in the `.env` later
- In "Sandbox settings", update the callback URLs to use your publicly accessible URL
  - For example, `https://srkgjh-33-444-88-111.ngrok-free.app/api/notifications/whatsapp/incoming`

## 3. Update your `services/.env` file

- Set `TWILIO_SID`, `TWILIO_AUTHTOKEN`, `TWILIO_MESSAGING_SID`, and `TWILIO_WHATSAPP_NUMBER` to the information gathered above
- Set `MOCK_TWILIO=` (empty string)
- Set `EXTERNAL_121_SERVICE_URL` to the public url generated for example by `ngrok`
  - eg. `EXTERNAL_121_SERVICE_URL=https://srkgjh-33-444-88-111.ngrok-free.app/`

## 4. Restart the 121-service and test

- Make sure to run `npm run start:services` after the changes, so the new value(s) will be used.
- Now, you can, for example, change the WhatsApp number of a PA in the Portal and try sending yourself a WhatsApp message. This should work the same as production.

## Relevant links / documentation

1. [Twilio portal](https://www.twilio.com/login)
1. [Twilio API documentation](https://www.twilio.com/docs)
