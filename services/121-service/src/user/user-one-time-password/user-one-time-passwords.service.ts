import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { OneTimePasswordVerificationFailureReason } from '@121-service/src/user/user-one-time-password/enum/one-time-password-verification-failure-reason.enum';
import { CreateOneTimePasswordParams } from '@121-service/src/user/user-one-time-password/interfaces/create-one-time-password-params.interface';
import { CreateOneTimePasswordResult } from '@121-service/src/user/user-one-time-password/interfaces/create-one-time-password-result.interface';
import { VerifyOneTimePasswordParams } from '@121-service/src/user/user-one-time-password/interfaces/verify-one-time-password-params.interface';
import { VerifyOneTimePasswordResult } from '@121-service/src/user/user-one-time-password/interfaces/verify-one-time-password-result.interface';
import {
  ONE_TIME_PASSWORD_CHARACTERS,
  ONE_TIME_PASSWORD_EXPIRATION_MS,
  ONE_TIME_PASSWORD_LENGTH,
  ONE_TIME_PASSWORD_LOCKOUT_MS,
  ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
  ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-one-time-password/user-one-time-password.const';
import { UserOneTimePasswordEntity } from '@121-service/src/user/user-one-time-password/user-one-time-password.entity';
import { UserOneTimePasswordRepository } from '@121-service/src/user/user-one-time-password/user-one-time-password.repository';

@Injectable()
export class UserOneTimePasswordsService {
  public constructor(private readonly userOneTimePasswordRepository: UserOneTimePasswordRepository) {}

  public async createOneTimePassword({
    userId,
  }: CreateOneTimePasswordParams): Promise<CreateOneTimePasswordResult | undefined> {
    const oneTimePassword = this.generateOneTimePassword();
    const hashedOneTimePassword = this.hashOneTimePassword({ oneTimePassword });
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + ONE_TIME_PASSWORD_EXPIRATION_MS);

    const isReplaced =
      await this.userOneTimePasswordRepository.replaceForUserIfIssuedBeforeAndNotLocked({
        userId,
        oneTimePassword: hashedOneTimePassword,
        issuedAt,
        expiresAt,
        previousIssuedBefore: new Date(
          issuedAt.getTime() - ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS,
        ),
      });

    if (!isReplaced) {
      return;
    }

    return { oneTimePassword, expiresAt };
  }

  private generateOneTimePassword(): string {
    const characters = Array.from(
      { length: ONE_TIME_PASSWORD_LENGTH },
      () => ONE_TIME_PASSWORD_CHARACTERS[crypto.randomInt(ONE_TIME_PASSWORD_CHARACTERS.length)],
    );
    return characters.join('');
  }

  private hashOneTimePassword({ oneTimePassword }: { oneTimePassword: string }): string {
    return crypto
      .createHmac('sha256', env.SECRETS_121_SERVICE_SECRET)
      .update(oneTimePassword)
      .digest('hex');
  }

  public async verifyOneTimePassword({
    userId,
    oneTimePassword,
  }: VerifyOneTimePasswordParams): Promise<VerifyOneTimePasswordResult> {
    const now = new Date();
    const userOneTimePassword = await this.userOneTimePasswordRepository.getByUserId({ userId });

    if (!userOneTimePassword) {
      return {
        isVerified: false,
        failureReason: OneTimePasswordVerificationFailureReason.noCode,
      };
    }

    const unusableReason = this.getUnusableReason({ userOneTimePassword, now });
    if (unusableReason) {
      return { isVerified: false, failureReason: unusableReason };
    }

    const hashedOneTimePassword = this.hashOneTimePassword({ oneTimePassword: this.normalizeOneTimePassword({ oneTimePassword }) });

    if (!this.isSameHash({ hashedOneTimePassword, storedHashedOneTimePassword: userOneTimePassword.oneTimePassword })) {
      const lockedUntil = new Date(now.getTime() + ONE_TIME_PASSWORD_LOCKOUT_MS);
      const { isLocked } =
        await this.userOneTimePasswordRepository.recordFailedAttemptIfUsable({
          userId,
          oneTimePassword: userOneTimePassword.oneTimePassword,
          now,
          maxFailedAttempts: ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
          lockedUntil,
        });
      return {
        isVerified: false,
        failureReason: OneTimePasswordVerificationFailureReason.wrongCode,
        lockedUntil: isLocked ? lockedUntil : undefined,
      };
    }

    const isConsumed = await this.userOneTimePasswordRepository.consumeIfUsable({
      userId,
      oneTimePassword: hashedOneTimePassword,
      consumedAt: now,
      maxFailedAttempts: ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
    });

    if (!isConsumed) {
      return {
        isVerified: false,
        failureReason: await this.getConcurrentChangeReason({
          userId,
          hashedOneTimePassword,
          now,
        }),
      };
    }

    return { isVerified: true };
  }

  private getUnusableReason({
    userOneTimePassword,
    now,
  }: {
    userOneTimePassword: UserOneTimePasswordEntity;
    now: Date;
  }): OneTimePasswordVerificationFailureReason | undefined {
    if (userOneTimePassword.failedAttempts >= ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS) {
      return OneTimePasswordVerificationFailureReason.locked;
    }
    if (userOneTimePassword.consumedAt !== null) {
      return OneTimePasswordVerificationFailureReason.consumed;
    }
    if (userOneTimePassword.expiresAt <= now) {
      return OneTimePasswordVerificationFailureReason.expired;
    }
    return undefined;
  }

  private normalizeOneTimePassword({ oneTimePassword }: { oneTimePassword: string }): string {
    return oneTimePassword.trim().toUpperCase();
  }

  private isSameHash({
    hashedOneTimePassword,
    storedHashedOneTimePassword,
  }: {
    hashedOneTimePassword: string;
    storedHashedOneTimePassword: string;
  }): boolean {
    const hashedOneTimePasswordBuffer = Buffer.from(hashedOneTimePassword, 'hex');
    const storedHashedOneTimePasswordBuffer = Buffer.from(storedHashedOneTimePassword, 'hex');

    if (hashedOneTimePasswordBuffer.length !== storedHashedOneTimePasswordBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashedOneTimePasswordBuffer, storedHashedOneTimePasswordBuffer);
  }

  // The atomic consume only fails after a concurrent change to the code was
  // committed, so re-reading the code reveals what that change was
  private async getConcurrentChangeReason({
    userId,
    hashedOneTimePassword,
    now,
  }: {
    userId: number;
    hashedOneTimePassword: string;
    now: Date;
  }): Promise<OneTimePasswordVerificationFailureReason> {
    const userOneTimePassword = await this.userOneTimePasswordRepository.getByUserId({ userId });

    if (!userOneTimePassword) {
      return OneTimePasswordVerificationFailureReason.noCode;
    }

    const unusableReason = this.getUnusableReason({ userOneTimePassword, now });
    if (
      unusableReason &&
      this.isSameHash({ hashedOneTimePassword, storedHashedOneTimePassword: userOneTimePassword.oneTimePassword })
    ) {
      return unusableReason;
    }

    return OneTimePasswordVerificationFailureReason.replaced;
  }
}
