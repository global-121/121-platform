import dotenv from 'dotenv';
dotenv.config();

import { getAccessToken } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { generateRandomId } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { postTransaction } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { encryptPinV1 } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';

const API_BASE_URL = `${process.env.API_BASE_URL}`;
const CLIENT_ID = `${process.env.CLIENT_ID}`;
const CLIENT_SECRET = `${process.env.CLIENT_SECRET}`;
const pin = `${process.env.ZAMBIA_DISBURSEMENT_PIN}`;
const rsaPublicKeyForPinEncryption = `${process.env.PIN_RSA_ENCRYPTION_PUBLIC_KEY_V1}`;
// RSA encryption is relatively slow, so only do this encryption once per app-startup.
const pinEncrypted = encryptPinV1(pin, rsaPublicKeyForPinEncryption);

const example_body = {
  payee: {
    currency: 'ZMW',
    msisdn: '978980279', // Should be length 9
    name: 'John Doe',
  },
  reference: generateRandomId(),
  pin: pinEncrypted,
  transaction: {
    amount: 0.01,
    id: generateRandomId(),
    // If the msisdn is a "subscriber" (a single person as customer), then the type is 'B2C'.
    // If the msisdn is a business (a company as customer), then the type is 'B2B'.
    // Disbursements to subscribers with "B2B" will fail and we'll get an error.
    // Disbursements to businesses with "B2C" will fail and we'll get an error.
    type: 'B2C',
  },
};

const access_token = await getAccessToken({
  url: `${API_BASE_URL}/auth/oauth2/token`,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
});
const result = await postTransaction({
  url: `${API_BASE_URL}/standard/v2/disbursements/`,
  access_token,
  body: example_body,
});

console.log('result');
console.log(result);
