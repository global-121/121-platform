import { Injectable } from '@nestjs/common';
import { constants, createPublicKey, publicEncrypt } from 'node:crypto';

@Injectable()
export class AlfouadEncryptionService {
  // Encrypts a value with the agent's RSA public key, matching the BestRate
  // reference implementation: PKCS#1 v1.5 padding, result Base64-encoded.
  public encrypt({
    data,
    publicKeyXml,
  }: {
    data: string;
    publicKeyXml: string;
  }): string {
    const { modulus, exponent } = this.parseRsaParameters({ publicKeyXml });
    const publicKey = createPublicKey({
      key: {
        kty: 'RSA',
        n: this.toBase64Url(modulus),
        e: this.toBase64Url(exponent),
      },
      format: 'jwk',
    });
    const encrypted = publicEncrypt(
      { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(data, 'utf8'),
    );
    return encrypted.toString('base64');
  }

  // The public key is provided as a .NET `RSAParameters` XML string containing
  // the standard-Base64 Modulus and Exponent.
  private parseRsaParameters({ publicKeyXml }: { publicKeyXml: string }): {
    modulus: string;
    exponent: string;
  } {
    const modulus = publicKeyXml.match(/<Modulus>(.*?)<\/Modulus>/)?.[1];
    const exponent = publicKeyXml.match(/<Exponent>(.*?)<\/Exponent>/)?.[1];
    if (!modulus || !exponent) {
      throw new Error(
        'Invalid Al Fouad public key: expected RSAParameters XML with Modulus and Exponent',
      );
    }
    return { modulus, exponent };
  }

  private toBase64Url(base64: string): string {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
