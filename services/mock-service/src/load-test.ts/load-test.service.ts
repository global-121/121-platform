import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { EXTERNAL_API } from '../config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class LoadTestService {
  private baseUrl = `${EXTERNAL_API.rootApi}`;

  private httpService = new HttpService();
  public async loadTest(): Promise<void> {
    const header = await this.getHeader();

    let referenceIdNumeric = 1;
    let phoneNumberNumeric = 14155238886;
    const randomString = Math.random().toString(36).substring(7);

    const promises = [];

    for (let i = 0; i < 1000; i += 5) {
      promises.push(
        new Promise<void>((resolve): void => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          setTimeout(async () => {
            const registrations = [];
            for (let j = 0; j < 5; j++) {
              referenceIdNumeric = referenceIdNumeric + 1;
              console.log(
                '🚀 ~ file: load-test.service.ts:28 ~ LoadTestService ~ setTimeout ~ referenceIdNumeric:',
                referenceIdNumeric,
              );
              phoneNumberNumeric = phoneNumberNumeric + 1;
              const registration = {
                referenceId: `testreference-$${randomString}-${referenceIdNumeric}`,
                preferredLanguage: 'en',
                paymentAmountMultiplier: 1,
                firstName: `John${referenceIdNumeric}`,
                lastName: `Smith${referenceIdNumeric}`,
                phoneNumber: `${phoneNumberNumeric}`,
                fspName: 'Intersolve-visa',
                whatsappPhoneNumber: `${phoneNumberNumeric}`,
                addressStreet: 'Teststraat',
                addressHouseNumber: '1',
                addressHouseNumberAddition: 'a',
                addressPostalCode: '1234AB',
                addressCity: 'Stad',
                scope: 'utrecht.houten',
              };
              registrations.push(registration);
            }
            const result = this.importRegistration(registrations, header);
            console.log(result);
            resolve();
          }, i * 200); // 200ms delay for each group of 5 registrations
        }),
      );
    }

    await Promise.all(promises);
  }

  public async importRegistration(
    registrations: object[],
    headers: any,
  ): Promise<any> {
    const programId = 3;
    const url = `${this.baseUrl}/programs/${programId}/registrations/import`;
    const body = registrations;
    const result = lastValueFrom(
      this.httpService.post(url, body, { headers: headers }),
    );
    return result;
  }

  public async getHeader(): Promise<any> {
    const url = `${this.baseUrl}/users/login`;
    const loginResult = (await this.httpService
      .post(url, {
        username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
        password: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
      })
      .toPromise()) as any;
    const cookies = loginResult.headers['set-cookie'];
    const accessToken = cookies
      .find((cookie: string) => cookie.startsWith('access_token_general'))
      .split(';')[0];

    return {
      'Content-Type': 'application/json',
      Cookie: accessToken,
    };
  }
}
