import { encryptAes } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { base64ToBuffer } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';

const example_payload = {
  reference: '1234',
  subscriber: {
    country: 'UG',
    currency: 'UGX',
    msisdn: '752604392',
  },
  transaction: {
    amount: '100',
    country: 'UG',
    currency: 'UGX',
    id: 'test_id ',
  },
};

const example_key_base64 = 'PSw37xtnShLl7zgWn4dLSnf1J5GRhRsOD4OfvJOuLIM=';
const example_iv_base64 = 'gGIhDvCBnSBhBgYiXCyMnw==';

const expected_x_signature =
  'bDOsVGZzbK0P5jO/M5QVMH/qxSmRJLEvIPZCdW6H81xvsZNI6jZej54oBQlHZ38yy63QNeyyYcfEkGJ8f3f15wHWs86V9BCIpHSesS3SrhozE/gGA1fLydeSS26mw0jhyt9XIpabk1RjDH59SfsrkHKU38I5mRlthG/t2qXJck0FhNR64bgOExm9CsuxUlfpsSoW1g81g1u5a4yMFIHhp77f+h3EXNHzcEsdSWhqTho=';

// Actually do the encryption
const xSignature = encryptAes(
  example_payload,
  base64ToBuffer(example_key_base64),
  base64ToBuffer(example_iv_base64),
);

if (xSignature !== expected_x_signature) {
  throw new Error(
    `xSignature does not match. Expected: ${expected_x_signature}, got: ${xSignature}`,
  );
} else {
  console.log('Message signing successfull.');
}
