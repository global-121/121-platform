import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { CreateOtpParams } from '@121-service/src/user/user-otp/interfaces/create-otp-params.interface';
import { CreateOtpResult } from '@121-service/src/user/user-otp/interfaces/create-otp-result.interface';
import { VerifyOtpParams } from '@121-service/src/user/user-otp/interfaces/verify-otp-params.interface';
import {
  OTP_CHARACTERS,
  OTP_EXPIRATION_MS,
  OTP_LENGTH,
  OTP_LOCKOUT_MS,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-otp/user-otp.const';
import { UserOtpEntity } from '@121-service/src/user/user-otp/user-otp.entity';
import { UserOtpRepository } from '@121-service/src/user/user-otp/user-otp.repository';

@Injectable()
export class UserOtpService {
  public constructor(private readonly userOtpRepository: UserOtpRepository) {}

  public async createOtp({
    userId,
  }: CreateOtpParams): Promise<CreateOtpResult | undefined> {
    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp({ otp });
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + OTP_EXPIRATION_MS);

    const isReplaced =
      await this.userOtpRepository.replaceForUserIfIssuedBeforeAndNotLocked({
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

  public async verifyOtp({ userId, otp }: VerifyOtpParams): Promise<boolean> {
    const now = new Date();
    const userOtp = await this.userOtpRepository.getByUserId({ userId });

    if (!userOtp || !this.isUsable({ userOtp, now })) {
      return false;
    }

    const hashedOtp = this.hashOtp({ otp: this.normalizeOtp({ otp }) });

    if (!this.isSameHash({ hashedOtp, storedHashedOtp: userOtp.otp })) {
      await this.userOtpRepository.recordFailedAttempt({
        userId,
        maxFailedAttempts: OTP_MAX_FAILED_ATTEMPTS,
        lockedUntil: new Date(now.getTime() + OTP_LOCKOUT_MS),
      });
      return false;
    }

    return await this.userOtpRepository.consumeIfUsable({
      userId,
      otp: hashedOtp,
      consumedAt: now,
      maxFailedAttempts: OTP_MAX_FAILED_ATTEMPTS,
    });
  }

  private isUsable({
    userOtp,
    now,
  }: {
    userOtp: UserOtpEntity;
    now: Date;
  }): boolean {
    const isConsumed = userOtp.consumedAt !== null;
    const isExpired = userOtp.expiresAt <= now;
    const hasReachedMaxFailedAttempts =
      userOtp.failedAttempts >= OTP_MAX_FAILED_ATTEMPTS;

    return !isConsumed && !isExpired && !hasReachedMaxFailedAttempts;
  }

  private normalizeOtp({ otp }: { otp: string }): string {
    return otp.trim().toUpperCase();
  }

  private isSameHash({
    hashedOtp,
    storedHashedOtp,
  }: {
    hashedOtp: string;
    storedHashedOtp: string;
  }): boolean {
    const hashedOtpBuffer = Buffer.from(hashedOtp, 'hex');
    const storedHashedOtpBuffer = Buffer.from(storedHashedOtp, 'hex');

    if (hashedOtpBuffer.length !== storedHashedOtpBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashedOtpBuffer, storedHashedOtpBuffer);
  }
}
