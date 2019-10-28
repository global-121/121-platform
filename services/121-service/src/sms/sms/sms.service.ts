import { Injectable } from '@nestjs/common';
import { TWILIO } from '../../secrets';

@Injectable()
export class SmsService {
  public constructor() {}

  public sendSms() {
    console.log('Send sms')
    const client = require('twilio')(TWILIO.sid, TWILIO.authToken);

    client.messages
      .create({
        body: 'Hi there!',
        from: TWILIO.testFromNumber,
        statusCallback: 'https://postb.in/1572267842247-3766113072633',
        to: TWILIO.testToNumber,
      })
      .then(message => console.log(message));
  }
}
