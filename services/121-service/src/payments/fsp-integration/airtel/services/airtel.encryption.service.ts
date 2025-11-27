import { Injectable } from '@nestjs/common';
import { constants, publicEncrypt } from 'node:crypto';

@Injectable()
export class AirtelEncryptionService {
  private rsaPublicKeyToPem(key: string): string {
    const formattedKey = `-----BEGIN PUBLIC KEY-----\n${key
      .match(/.{1,64}/g)
      ?.join('\n')}\n-----END PUBLIC KEY-----`;
    return formattedKey;
  }

  public encryptPinV1(data: string, base64PublicKey: string): string {
    const publicKey = this.rsaPublicKeyToPem(base64PublicKey);
    const encrypted = publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(data),
    );
    return encrypted.toString('base64');
  }
}
