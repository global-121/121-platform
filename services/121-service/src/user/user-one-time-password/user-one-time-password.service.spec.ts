import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { OneTimePasswordVerificationFailureReason } from '@121-service/src/user/user-one-time-password/enum/one-time-password-verification-failure-reason.enum';
import { CreateOneTimePasswordResult } from '@121-service/src/user/user-one-time-password/interfaces/create-one-time-password-result.interface';
import {
  ONE_TIME_PASSWORD_EXPIRATION_MS,
  ONE_TIME_PASSWORD_LOCKOUT_MS,
  ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
  ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-one-time-password/user-one-time-password.const';
import { UserOneTimePasswordEntity } from '@121-service/src/user/user-one-time-password/user-one-time-password.entity';
import { UserOneTimePasswordRepository } from '@121-service/src/user/user-one-time-password/user-one-time-password.repository';
import { UserOneTimePasswordService } from '@121-service/src/user/user-one-time-password/user-one-time-password.service';

describe('UserOneTimePasswordService', () => {
  let service: UserOneTimePasswordService;
  let userOneTimePasswordRepository: jest.Mocked<UserOneTimePasswordRepository>;

  const hashOneTimePassword = ({ oneTimePassword }: { oneTimePassword: string }): string =>
    crypto
      .createHmac('sha256', env.SECRETS_121_SERVICE_SECRET)
      .update(oneTimePassword)
      .digest('hex');

  const createOneTimePasswordOrThrow = async (): Promise<CreateOneTimePasswordResult> => {
    const createOneTimePasswordResult = await service.createOneTimePassword({ userId: 1 });
    if (!createOneTimePasswordResult) {
      throw new Error('Expected a one-time password to be created');
    }
    return createOneTimePasswordResult;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOneTimePasswordService,
        {
          provide: UserOneTimePasswordRepository,
          useValue: {
            replaceForUserIfIssuedBeforeAndNotLocked: jest
              .fn()
              .mockResolvedValue(true),
            getByUserId: jest.fn(),
            consumeIfUsable: jest.fn().mockResolvedValue(true),
            recordFailedAttemptIfUsable: jest
              .fn()
              .mockResolvedValue({ isLocked: false }),
          },
        },
      ],
    }).compile();

    service = module.get(UserOneTimePasswordService);
    userOneTimePasswordRepository = module.get(UserOneTimePasswordRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when creating a one-time password', () => {
    it('returns a 6 character code of digits and uppercase letters', async () => {
      // Act
      const { oneTimePassword } = await createOneTimePasswordOrThrow();

      // Assert
      expect(oneTimePassword).toMatch(/^[0-9A-Z]{6}$/);
    });

    it('stores an HMAC hash of the code instead of the code itself', async () => {
      // Act
      const { oneTimePassword } = await createOneTimePasswordOrThrow();

      // Assert
      expect(
        userOneTimePasswordRepository.replaceForUserIfIssuedBeforeAndNotLocked,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, oneTimePassword: hashOneTimePassword({ oneTimePassword }) }),
      );
    });

    it('expires the code after the configured expiration time', async () => {
      // Arrange
      const now = new Date('2026-10-27T10:00:00.000Z');
      jest.useFakeTimers({ now });

      // Act
      const { expiresAt } = await createOneTimePasswordOrThrow();

      // Assert
      expect(expiresAt).toEqual(new Date(now.getTime() + ONE_TIME_PASSWORD_EXPIRATION_MS));
    });

    it('only replaces a previous code that was issued before the cooldown', async () => {
      // Arrange
      const now = new Date('2026-10-27T10:00:00.000Z');
      jest.useFakeTimers({ now });

      // Act
      await createOneTimePasswordOrThrow();

      // Assert
      expect(
        userOneTimePasswordRepository.replaceForUserIfIssuedBeforeAndNotLocked,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          issuedAt: now,
          previousIssuedBefore: new Date(
            now.getTime() - ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS,
          ),
        }),
      );
    });

    it('returns no code when the previous code was issued within the cooldown or the user is locked', async () => {
      // Arrange
      userOneTimePasswordRepository.replaceForUserIfIssuedBeforeAndNotLocked.mockResolvedValue(
        false,
      );

      // Act
      const createOneTimePasswordResult = await service.createOneTimePassword({ userId: 1 });

      // Assert
      expect(createOneTimePasswordResult).toBeUndefined();
    });
  });

  describe('when verifying a one-time password', () => {
    const userId = 1;
    const oneTimePassword = '4A1RQ9';
    const now = new Date('2026-10-27T10:00:00.000Z');

    const buildUserOneTimePassword = (
      overrides: Partial<UserOneTimePasswordEntity> = {},
    ): UserOneTimePasswordEntity =>
      ({
        userId,
        oneTimePassword: hashOneTimePassword({ oneTimePassword }),
        issuedAt: now,
        expiresAt: new Date(now.getTime() + ONE_TIME_PASSWORD_EXPIRATION_MS),
        consumedAt: null,
        failedAttempts: 0,
        lockedUntil: null,
        ...overrides,
      }) as UserOneTimePasswordEntity;

    beforeEach(() => {
      jest.useFakeTimers({ now });
      userOneTimePasswordRepository.getByUserId.mockResolvedValue(buildUserOneTimePassword());
    });

    it('consumes a valid code and returns that it is verified', async () => {
      // Act
      const verifyOneTimePasswordResult = await service.verifyOneTimePassword({ userId, oneTimePassword });

      // Assert
      expect(verifyOneTimePasswordResult).toEqual({ isVerified: true });
      expect(userOneTimePasswordRepository.consumeIfUsable).toHaveBeenCalledWith({
        userId,
        oneTimePassword: hashOneTimePassword({ oneTimePassword }),
        consumedAt: now,
        maxFailedAttempts: ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
      });
    });

    it('accepts a code with surrounding whitespace and lowercase letters', async () => {
      // Act
      const verifyOneTimePasswordResult = await service.verifyOneTimePassword({
        userId,
        oneTimePassword: ` ${oneTimePassword.toLowerCase()} `,
      });

      // Assert
      expect(verifyOneTimePasswordResult).toEqual({ isVerified: true });
    });

    it.each([
      {
        description: 'consumed',
        changedUserOneTimePassword: buildUserOneTimePassword({ consumedAt: now }),
        failureReason: OneTimePasswordVerificationFailureReason.consumed,
      },
      {
        description: 'locked',
        changedUserOneTimePassword: buildUserOneTimePassword({
          failedAttempts: ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
          lockedUntil: new Date(now.getTime() + ONE_TIME_PASSWORD_LOCKOUT_MS),
        }),
        failureReason: OneTimePasswordVerificationFailureReason.locked,
      },
      {
        description: 'replaced',
        changedUserOneTimePassword: buildUserOneTimePassword({ oneTimePassword: hashOneTimePassword({ oneTimePassword: 'NEW123' }) }),
        failureReason: OneTimePasswordVerificationFailureReason.replaced,
      },
    ])(
      'fails as $description when the code was $description concurrently',
      async ({ changedUserOneTimePassword, failureReason }) => {
        // Arrange
        userOneTimePasswordRepository.getByUserId
          .mockResolvedValueOnce(buildUserOneTimePassword())
          .mockResolvedValueOnce(changedUserOneTimePassword);
        userOneTimePasswordRepository.consumeIfUsable.mockResolvedValue(false);

        // Act
        const verifyOneTimePasswordResult = await service.verifyOneTimePassword({ userId, oneTimePassword });

        // Assert
        expect(verifyOneTimePasswordResult).toEqual({ isVerified: false, failureReason });
      },
    );

    it('fails with no code when the code was deleted concurrently', async () => {
      // Arrange
      userOneTimePasswordRepository.getByUserId
        .mockResolvedValueOnce(buildUserOneTimePassword())
        .mockResolvedValueOnce(null);
      userOneTimePasswordRepository.consumeIfUsable.mockResolvedValue(false);

      // Act
      const verifyOneTimePasswordResult = await service.verifyOneTimePassword({ userId, oneTimePassword });

      // Assert
      expect(verifyOneTimePasswordResult).toEqual({
        isVerified: false,
        failureReason: OneTimePasswordVerificationFailureReason.noCode,
      });
    });

    it('records a failed attempt with a lockout time for a wrong code', async () => {
      // Act
      const verifyOneTimePasswordResult = await service.verifyOneTimePassword({
        userId,
        oneTimePassword: 'WRONG1',
      });

      // Assert
      expect(verifyOneTimePasswordResult).toEqual({
        isVerified: false,
        failureReason: OneTimePasswordVerificationFailureReason.wrongCode,
      });
      expect(userOneTimePasswordRepository.recordFailedAttemptIfUsable).toHaveBeenCalledWith(
        {
          userId,
          oneTimePassword: hashOneTimePassword({ oneTimePassword }),
          now,
          maxFailedAttempts: ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
          lockedUntil: new Date(now.getTime() + ONE_TIME_PASSWORD_LOCKOUT_MS),
        },
      );
    });

    it('returns the end of the lock when a wrong code locks the code', async () => {
      // Arrange
      userOneTimePasswordRepository.recordFailedAttemptIfUsable.mockResolvedValue({
        isLocked: true,
      });

      // Act
      const verifyOneTimePasswordResult = await service.verifyOneTimePassword({
        userId,
        oneTimePassword: 'WRONG1',
      });

      // Assert
      expect(verifyOneTimePasswordResult).toEqual({
        isVerified: false,
        failureReason: OneTimePasswordVerificationFailureReason.wrongCode,
        lockedUntil: new Date(now.getTime() + ONE_TIME_PASSWORD_LOCKOUT_MS),
      });
    });

    it('fails with no code when the user has no code', async () => {
      // Arrange
      userOneTimePasswordRepository.getByUserId.mockResolvedValue(null);

      // Act
      const verifyOneTimePasswordResult = await service.verifyOneTimePassword({ userId, oneTimePassword });

      // Assert
      expect(verifyOneTimePasswordResult).toEqual({
        isVerified: false,
        failureReason: OneTimePasswordVerificationFailureReason.noCode,
      });
    });

    it.each([
      {
        description: 'already consumed',
        userOneTimePassword: buildUserOneTimePassword({ consumedAt: now }),
        failureReason: OneTimePasswordVerificationFailureReason.consumed,
      },
      {
        description: 'expired',
        userOneTimePassword: buildUserOneTimePassword({ expiresAt: now }),
        failureReason: OneTimePasswordVerificationFailureReason.expired,
      },
      {
        description: 'locked after too many failed attempts',
        userOneTimePassword: buildUserOneTimePassword({
          failedAttempts: ONE_TIME_PASSWORD_MAX_FAILED_ATTEMPTS,
          lockedUntil: new Date(now.getTime() + ONE_TIME_PASSWORD_LOCKOUT_MS),
        }),
        failureReason: OneTimePasswordVerificationFailureReason.locked,
      },
    ])(
      'fails with the reason for a correct code that is $description, without recording a failed attempt',
      async ({ userOneTimePassword, failureReason }) => {
        // Arrange
        userOneTimePasswordRepository.getByUserId.mockResolvedValue(userOneTimePassword);

        // Act
        const verifyOneTimePasswordResult = await service.verifyOneTimePassword({ userId, oneTimePassword });

        // Assert
        expect(verifyOneTimePasswordResult).toEqual({ isVerified: false, failureReason });
        expect(
          userOneTimePasswordRepository.recordFailedAttemptIfUsable,
        ).not.toHaveBeenCalled();
      },
    );

    it('fails as a wrong code and records a failed attempt when the stored code is not a valid hash', async () => {
      // Arrange
      userOneTimePasswordRepository.getByUserId.mockResolvedValue(
        buildUserOneTimePassword({ oneTimePassword: 'not-a-hash' }),
      );

      // Act
      const verifyOneTimePasswordResult = await service.verifyOneTimePassword({ userId, oneTimePassword });

      // Assert
      expect(verifyOneTimePasswordResult).toEqual({
        isVerified: false,
        failureReason: OneTimePasswordVerificationFailureReason.wrongCode,
      });
      expect(userOneTimePasswordRepository.recordFailedAttemptIfUsable).toHaveBeenCalled();
    });
  });
});
