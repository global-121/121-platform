import dotenv from 'dotenv';
dotenv.config();

import { encryptRsaKeyIv } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { encryptRsaPin } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { getAccessToken } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { getRsaKey } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { generateRandomBytes } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { encryptAes } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { base64ToBuffer } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { postTransaction } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { rsaKeyToPem } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { generateRandomId } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';

const access_token = await getAccessToken();
// console.log('Access Token:', access_token);

// Get RSA public key
const rsaPublicKeyPem = await getRsaKey(access_token);
// console.log('RSA Public Key:');
// console.log(rsaPublicKeyPem);

// Generate AES key (256 bits) and IV (128 bits)
const aesKey = generateRandomBytes(32); // 32 bytes = 256 bits
const iv = generateRandomBytes(16); // 16 bytes = 128 bits

// Step 2: Base64 encode key and IV
const aesKeyB64 = aesKey.toString('base64');
const ivB64 = iv.toString('base64');

// console.log('aesKeyB64:', aesKeyB64);
// console.log('ivB64:', ivB64);
const random_id = generateRandomId();
console.log('random_id:', random_id);

const example_body = {
  payee: {
    msisdn: '7526',
    wallet_type: 'NORMAL',
  },
  reference: random_id,
  pin: '',
  transaction: {
    amount: 1000,
    id: random_id,
    type: 'B2C',
  },
};

const pin = `${process.env.ZAMBIA_DISBURSEMENT_PIN}`;

// The docs say: Public key is available in code snippet. Copy it from there.
// But we also fetched a public RSA key via the API. So we have 2.
// Not super clear which to use.
const rsaPublicKeyForPinEncryption = `${process.env.PIN_RSA_ENCRYPTION_PUBLIC_KEY}`;
const rsaPublicKeyForPinEncryptionPem = rsaKeyToPem(
  rsaPublicKeyForPinEncryption,
);
// console.log('rsaPublicKeyForPinEncryption', rsaPublicKeyForPinEncryption);
// console.log('rsaPublicKeyForPinEncryptionPem', rsaPublicKeyForPinEncryptionPem);

// Do one or the other.
// pinEncrypted = encryptRsaPin(pin, rsaPublicKeyPem);
const pinEncrypted = encryptRsaPin(pin, rsaPublicKeyForPinEncryptionPem);
console.log(pinEncrypted);

example_body.pin = pinEncrypted;
console.log('example_body');
console.log(example_body);

const xSignature = encryptAes(
  example_body,
  base64ToBuffer(aesKeyB64),
  base64ToBuffer(ivB64),
);

// console.log('xSignature');
// console.log(xSignature);

// Concatenate key:iv
const keyIvConcat = `${aesKeyB64}:${ivB64}`;

// Encrypt the key:iv using RSA public key
const xKey = encryptRsaKeyIv(keyIvConcat, rsaPublicKeyPem);
// console.log('xKey');
// console.log(xKey);

const result = await postTransaction(
  access_token,
  xSignature,
  xKey,
  example_body,
);

console.log('result');
console.log(result);
