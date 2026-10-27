import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { CreateOtpParams } from '@121-service/src/user/user-otp/interfaces/create-otp-params.interface';
import { CreateOtpResult } from '@121-service/src/user/user-otp/interfaces/create-otp-result.interface';
import {
  OTP_CHARACTERS,
  OTP_EXPIRATION_MS,
  OTP_LENGTH,
  OTP_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-otp/user-otp.const';
import { UserOtpRepository } from '@121-service/src/user/user-otp/user-otp.repository';

@Injectable()
export class UserOtpService {
  public constructor(private readonly userOtpRepository: UserOtpRepository) {}

  // Returns undefined when the user's current OTP was issued within the cooldown
  public async createOtp({
    userId,
  }: CreateOtpParams): Promise<CreateOtpResult | undefined> {
    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp({ otp });
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + OTP_EXPIRATION_MS);

    const isReplaced =
      await this.userOtpRepository.replaceForUserIfIssuedBefore({
        userId,
        otp: hashedOtp,
        issuedAt,
        expiresAt,
        previousIssuedBefore: new Date(
          issuedAt.getTime() - OTP_REISSUE_COOLDOWN_MS,
        ),
      });

    if (!isReplaced) {
      return;
    }

    return { otp, expiresAt };
  }

  private generateOtp(): string {
    const characters = Array.from(
      { length: OTP_LENGTH },
      () => OTP_CHARACTERS[crypto.randomInt(OTP_CHARACTERS.length)],
    );
    return characters.join('');
  }

  private hashOtp({ otp }: { otp: string }): string {
    return crypto
      .createHmac('sha256', env.SECRETS_121_SERVICE_SECRET)
      .update(otp)
      .digest('hex');
  }
}
