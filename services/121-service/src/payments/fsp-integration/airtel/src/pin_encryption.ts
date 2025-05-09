import { encryptRsa } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { generateRsaKeyPair } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { decryptRsa } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';

// We cannot use the RSA public key in the docs for testing because we use
// a encryption padding scheme that has randomness (OAEP).

const { publicKey: rsaPublicKeyPem, privateKey: rsaPrivateKeyPem } =
  await generateRsaKeyPair();
// console.log('rsaPublicKeyPem');
// console.log(rsaPublicKeyPem);

const pin = '1234';

// Encrypt the key:iv using RSA public key
// We'll need to check if Airtel's encryption function works the same as our
// example RSA encryption function.
const xKey = encryptRsa(pin, rsaPublicKeyPem);
// console.log('xKey');
// console.log(xKey);

const decrypted = decryptRsa(xKey, rsaPrivateKeyPem);
// console.log(decrypted);

if (pin !== decrypted) {
  throw new Error(
    `decrypted does not match. Expected: ${pin}, got: ${decrypted}`,
  );
} else {
  console.log('Encrypting pin successfull.');
}
