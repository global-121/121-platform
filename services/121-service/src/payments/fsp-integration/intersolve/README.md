# Intersolve

This readme includes additional information / instructions on use of this FSP, that cannot be deduced from code.

NOTE: Currently the FSP Intersolve, which produces vouchers, is very much intertwined with WhatsApp as a delivery mechanism for delivering these vouchers. In that sense Intersolve is currently a lot more complex than other FSPs. It is on the backlog

## Relevant links / documentation

1. [Twilio portal](https://www.twilio.com/login)

## Setting up WhatsApp sandbox to test locally

1. Download ngrok
2. Connect your local port on which the 121-service runs to ngrok using `ngrok http <port-number>`
3. Copy the resulting https address as EXTERNAL_121_SERVICE_URL in .env (it must end with a slash!) and rebuild the 121-service.
4. Log in to the [Twilio portal](https://www.twilio.com/login)
5. Go to Messaging > Settings > WhatsApp sandbox settings
6. Update both the 'When a messages comes in' and 'Status callback url' fields with the ngrok address. Note that instead you can also fill in here the test-vm or staging URL's if you want to test there.
7. Subscribe yourself to the sandbox number by sending the requested message to the requested number.
8. Make sure that the sandbox number is equal to TWILIO_WHATSAPP_NUMBER in your local .env file (or on test/staging if you are testing there)
9. You are now set up to follow a full payment flow, including sending a 'yes' reply and receiving any outstanding vouchers and/or messages.
