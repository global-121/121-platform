import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { OtpVerificationFailureReason } from '@121-service/src/user/user-otp/enum/otp-verification-failure-reason.enum';
import { CreateOtpParams } from '@121-service/src/user/user-otp/interfaces/create-otp-params.interface';
import { CreateOtpResult } from '@121-service/src/user/user-otp/interfaces/create-otp-result.interface';
import { VerifyOtpParams } from '@121-service/src/user/user-otp/interfaces/verify-otp-params.interface';
import { VerifyOtpResult } from '@121-service/src/user/user-otp/interfaces/verify-otp-result.interface';
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

  public async verifyOtp({
    userId,
    otp,
  }: VerifyOtpParams): Promise<VerifyOtpResult> {
    const now = new Date();
    const userOtp = await this.userOtpRepository.getByUserId({ userId });

    if (!userOtp) {
      return {
        isVerified: false,
        failureReason: OtpVerificationFailureReason.noCode,
      };
    }

    const unusableReason = this.getUnusableReason({ userOtp, now });
    if (unusableReason) {
      return { isVerified: false, failureReason: unusableReason };
    }

    const hashedOtp = this.hashOtp({ otp: this.normalizeOtp({ otp }) });

    if (!this.isSameHash({ hashedOtp, storedHashedOtp: userOtp.otp })) {
      const lockedUntil = new Date(now.getTime() + OTP_LOCKOUT_MS);
      const { isLocked } =
        await this.userOtpRepository.recordFailedAttemptIfUsable({
          userId,
          otp: userOtp.otp,
          now,
          maxFailedAttempts: OTP_MAX_FAILED_ATTEMPTS,
          lockedUntil,
        });
      return {
        isVerified: false,
        failureReason: OtpVerificationFailureReason.wrongCode,
        lockedUntil: isLocked ? lockedUntil : undefined,
      };
    }

    const isConsumed = await this.userOtpRepository.consumeIfUsable({
      userId,
      otp: hashedOtp,
      consumedAt: now,
      maxFailedAttempts: OTP_MAX_FAILED_ATTEMPTS,
    });

    if (!isConsumed) {
      return {
        isVerified: false,
        failureReason: await this.getConcurrentChangeReason({
          userId,
          hashedOtp,
          now,
        }),
      };
    }

    return { isVerified: true };
  }

  private getUnusableReason({
    userOtp,
    now,
  }: {
    userOtp: UserOtpEntity;
    now: Date;
  }): OtpVerificationFailureReason | undefined {
    if (userOtp.failedAttempts >= OTP_MAX_FAILED_ATTEMPTS) {
      return OtpVerificationFailureReason.locked;
    }
    if (userOtp.consumedAt !== null) {
      return OtpVerificationFailureReason.consumed;
    }
    if (userOtp.expiresAt <= now) {
      return OtpVerificationFailureReason.expired;
    }
    return undefined;
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

  // The atomic consume only fails after a concurrent change to the code was
  // committed, so re-reading the code reveals what that change was
  private async getConcurrentChangeReason({
    userId,
    hashedOtp,
    now,
  }: {
    userId: number;
    hashedOtp: string;
    now: Date;
  }): Promise<OtpVerificationFailureReason> {
    const userOtp = await this.userOtpRepository.getByUserId({ userId });

    if (!userOtp) {
      return OtpVerificationFailureReason.noCode;
    }

    const unusableReason = this.getUnusableReason({ userOtp, now });
    if (
      unusableReason &&
      this.isSameHash({ hashedOtp, storedHashedOtp: userOtp.otp })
    ) {
      return unusableReason;
    }

    return OtpVerificationFailureReason.replaced;
  }
}
