import { Injectable } from '@nestjs/common';
import { constants, createPublicKey, publicEncrypt } from 'node:crypto';
import { xml2js } from 'xml-js';

interface RsaParametersXml {
  RSAParameters: {
    Modulus: { _text: string };
    Exponent: { _text: string };
  };
}

@Injectable()
export class AlfouadEncryptionService {
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
        n: Buffer.from(modulus, 'base64').toString('base64url'),
        e: Buffer.from(exponent, 'base64').toString('base64url'),
      },
      format: 'jwk',
    });

    const encrypted = publicEncrypt(
      { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(data, 'utf8'),
    );

    return encrypted.toString('base64');
  }

  private parseRsaParameters({ publicKeyXml }: { publicKeyXml: string }): {
    modulus: string;
    exponent: string;
  } {
    const parsed = xml2js(publicKeyXml, { compact: true }) as RsaParametersXml;

    const modulus = parsed.RSAParameters?.Modulus?._text?.trim();
    const exponent = parsed.RSAParameters?.Exponent?._text?.trim();

    if (!modulus || !exponent) {
      throw new Error(
        'Invalid Al Fouad public key: expected RSAParameters XML with Modulus and Exponent',
      );
    }

    return { modulus, exponent };
  }
}
