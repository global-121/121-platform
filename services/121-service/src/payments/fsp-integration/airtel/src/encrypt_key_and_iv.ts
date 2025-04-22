import { encryptRsa } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { generateRsaKeyPair } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';
import { decryptRsa } from '@121-service/src/payments/fsp-integration/airtel/src/util.ts';

// We cannot use the RSA public key in the docs for testing because we use
// a encryption padding scheme that has randomness (OAEP).

const { publicKey: rsaPublicKeyPem, privateKey: rsaPrivateKeyPem } =
  await generateRsaKeyPair();
// console.log('rsaPublicKeyPem');
// console.log(rsaPublicKeyPem);

const example_key_base64 = 'PSw37xtnShLl7zgWn4dLSnf1J5GRhRsOD4OfvJOuLIM=';
const example_iv_base64 = 'gGIhDvCBnSBhBgYiXCyMnw==';

// Concatenate key:iv
const keyIvConcat = `${example_key_base64}:${example_iv_base64}`;
// console.log(`key:iv: ${keyIvConcat}`);

// Encrypt the key:iv using RSA public key
// We'll need to check if Airtel's encryption function works the same as our
// example RSA encryption function.
const xKey = encryptRsa(keyIvConcat, rsaPublicKeyPem);
// console.log('xKey');
// console.log(xKey);

const decrypted = decryptRsa(xKey, rsaPrivateKeyPem);
// console.log(decrypted);

if (keyIvConcat !== decrypted) {
  throw new Error(
    `decrypted does not match. Expected: ${keyIvConcat}, got: ${decrypted}`,
  );
} else {
  console.log('Encrypting key and iv successfull.');
}
