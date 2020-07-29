/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { Get, Controller } from '@nestjs/common';

// Sandbox
const credentials = {
  apiKey: '041391029f5b1ee8c2f11147d44fb1d38f2171d9d22c97e9563cff2577b615d3',
  username: 'sandbox',
};
// Production app
// const credentials = {
//   apiKey: 'a0115aa56f6a93c0101ab4d021c8ed7412ee5e6456c1a834287292e3c3bec257',
//   username: 'global121',
// };

const AfricasTalking = require('africastalking')(credentials);

@Controller('api')
export class AppController {
  @Get('africatalk-test-send-sms')
  async africaTalkSendSMS(): Promise<any> {
    // Initialize a service e.g. SMS
    const sms = AfricasTalking.SMS;

    // Use the service
    const options = {
      to: ['+31612345678'],
      message:
        "I'm a lumberjack and its ok, I work all night and sleep all day",
    };

    // Send message and capture the response or error
    let result;
    await sms
      .send(options)
      .then((response: any) => {
        console.log(response);
        result = { response: response };
      })
      .catch((error: any) => {
        console.log(error);
        result = { error: error };
      });

    return result;
  }

  @Get('africatalk-test-mobile-payment')
  async africaTalkMobilePayment(): Promise<any> {
    // This code is set up based on SMS example + documentation. Also untested because apiKey cannot be generated

    // Send mobile payment
    const payments = AfricasTalking.PAYMENTS;

    const paymentOptions = {
      username: 'global121',
      productName: 'test-product',
      recipients: [
        {
          phoneNumber: '+254711123466', // Dutch phone number gives 'Destination not supported'
          currencyCode: 'EUR',
          amount: 0.01,
          metadata: {},
        },
      ],
    };

    let result;
    await payments
      .mobileB2C(paymentOptions)
      .then((response: any) => {
        console.log(response);
        result = { response: response };
      })
      .catch((error: any) => {
        console.log(error);
        result = { error: error };
      });

    return result;
  }
}
