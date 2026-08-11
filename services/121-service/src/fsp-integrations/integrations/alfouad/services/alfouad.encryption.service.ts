import { Injectable } from '@nestjs/common';
import { constants, createPublicKey, publicEncrypt } from 'node:crypto';

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
    const modulus = this.extractXmlTagValue({
      xml: publicKeyXml,
      tag: 'Modulus',
    });
    const exponent = this.extractXmlTagValue({
      xml: publicKeyXml,
      tag: 'Exponent',
    });
    if (!modulus || !exponent) {
      throw new Error(
        'Invalid Al Fouad public key: expected RSAParameters XML with Modulus and Exponent',
      );
    }
    return { modulus, exponent };
  }

  private extractXmlTagValue({
    xml,
    tag,
  }: {
    xml: string;
    tag: string;
  }): string | undefined {
    const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
    if (!match) {
      return;
    }

    const [, value] = match;
    if (!value) {
      return;
    }

    return value.trim();
  }
}
