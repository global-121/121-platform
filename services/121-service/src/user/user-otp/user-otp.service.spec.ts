import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { CreateOtpResult } from '@121-service/src/user/user-otp/interfaces/create-otp-result.interface';
import {
  OTP_EXPIRATION_MS,
  OTP_LOCKOUT_MS,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-otp/user-otp.const';
import { UserOtpEntity } from '@121-service/src/user/user-otp/user-otp.entity';
import { UserOtpRepository } from '@121-service/src/user/user-otp/user-otp.repository';
import { UserOtpService } from '@121-service/src/user/user-otp/user-otp.service';

describe('UserOtpService', () => {
  let service: UserOtpService;
  let userOtpRepository: jest.Mocked<UserOtpRepository>;

  const hashOtp = ({ otp }: { otp: string }): string =>
    crypto
      .createHmac('sha256', env.SECRETS_121_SERVICE_SECRET)
      .update(otp)
      .digest('hex');

  const createOtpOrThrow = async (): Promise<CreateOtpResult> => {
    const createOtpResult = await service.createOtp({ userId: 1 });
    if (!createOtpResult) {
      throw new Error('Expected an OTP to be created');
    }
    return createOtpResult;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOtpService,
        {
          provide: UserOtpRepository,
          useValue: {
            replaceForUserIfIssuedBeforeAndNotLocked: jest
              .fn()
              .mockResolvedValue(true),
            getByUserId: jest.fn(),
            consumeIfUsable: jest.fn().mockResolvedValue(true),
            recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(UserOtpService);
    userOtpRepository = module.get(UserOtpRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when creating an OTP', () => {
    it('returns a 6 character code of digits and uppercase letters', async () => {
      // Act
      const { otp } = await createOtpOrThrow();

      // Assert
      expect(otp).toMatch(/^[0-9A-Z]{6}$/);
    });

    it('stores an HMAC hash of the code instead of the code itself', async () => {
      // Act
      const { otp } = await createOtpOrThrow();

      // Assert
      expect(
        userOtpRepository.replaceForUserIfIssuedBeforeAndNotLocked,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, otp: hashOtp({ otp }) }),
      );
    });

    it('expires the code after the configured expiration time', async () => {
      // Arrange
      const now = new Date('2026-10-27T10:00:00.000Z');
      jest.useFakeTimers({ now });

      // Act
      const { expiresAt } = await createOtpOrThrow();

      // Assert
      expect(expiresAt).toEqual(new Date(now.getTime() + OTP_EXPIRATION_MS));
    });

    it('only replaces a previous code that was issued before the cooldown', async () => {
      // Arrange
      const now = new Date('2026-10-27T10:00:00.000Z');
      jest.useFakeTimers({ now });

      // Act
      await createOtpOrThrow();

      // Assert
      expect(
        userOtpRepository.replaceForUserIfIssuedBeforeAndNotLocked,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          issuedAt: now,
          previousIssuedBefore: new Date(
            now.getTime() - OTP_REISSUE_COOLDOWN_MS,
          ),
        }),
      );
    });

    it('returns no code when the previous code was issued within the cooldown or the user is locked', async () => {
      // Arrange
      userOtpRepository.replaceForUserIfIssuedBeforeAndNotLocked.mockResolvedValue(
        false,
      );

      // Act
      const createOtpResult = await service.createOtp({ userId: 1 });

      // Assert
      expect(createOtpResult).toBeUndefined();
    });
  });

  describe('when verifying an OTP', () => {
    const userId = 1;
    const otp = '4A1RQ9';
    const now = new Date('2026-10-27T10:00:00.000Z');

    const buildUserOtp = (
      overrides: Partial<UserOtpEntity> = {},
    ): UserOtpEntity =>
      ({
        userId,
        otp: hashOtp({ otp }),
        issuedAt: now,
        expiresAt: new Date(now.getTime() + OTP_EXPIRATION_MS),
        consumedAt: null,
        failedAttempts: 0,
        lockedUntil: null,
        ...overrides,
      }) as UserOtpEntity;

    beforeEach(() => {
      jest.useFakeTimers({ now });
      userOtpRepository.getByUserId.mockResolvedValue(buildUserOtp());
    });

    it('consumes a valid code and returns true', async () => {
      // Act
      const isVerified = await service.verifyOtp({ userId, otp });

      // Assert
      expect(isVerified).toBe(true);
      expect(userOtpRepository.consumeIfUsable).toHaveBeenCalledWith({
        userId,
        otp: hashOtp({ otp }),
        consumedAt: now,
        maxFailedAttempts: OTP_MAX_FAILED_ATTEMPTS,
      });
    });

    it('accepts a code with surrounding whitespace and lowercase letters', async () => {
      // Act
      const isVerified = await service.verifyOtp({
        userId,
        otp: ` ${otp.toLowerCase()} `,
      });

      // Assert
      expect(isVerified).toBe(true);
    });

    it('returns false when the code was consumed concurrently', async () => {
      // Arrange
      userOtpRepository.consumeIfUsable.mockResolvedValue(false);

      // Act
      const isVerified = await service.verifyOtp({ userId, otp });

      // Assert
      expect(isVerified).toBe(false);
    });

    it('records a failed attempt with a lockout time for a wrong code', async () => {
      // Act
      const isVerified = await service.verifyOtp({ userId, otp: 'WRONG1' });

      // Assert
      expect(isVerified).toBe(false);
      expect(userOtpRepository.recordFailedAttempt).toHaveBeenCalledWith({
        userId,
        maxFailedAttempts: OTP_MAX_FAILED_ATTEMPTS,
        lockedUntil: new Date(now.getTime() + OTP_LOCKOUT_MS),
      });
    });

    it('returns false when the user has no code', async () => {
      // Arrange
      userOtpRepository.getByUserId.mockResolvedValue(null);

      // Act
      const isVerified = await service.verifyOtp({ userId, otp });

      // Assert
      expect(isVerified).toBe(false);
    });

    it.each([
      {
        description: 'already consumed',
        userOtp: buildUserOtp({ consumedAt: now }),
      },
      {
        description: 'expired',
        userOtp: buildUserOtp({ expiresAt: now }),
      },
      {
        description: 'locked after too many failed attempts',
        userOtp: buildUserOtp({
          failedAttempts: OTP_MAX_FAILED_ATTEMPTS,
          lockedUntil: new Date(now.getTime() + OTP_LOCKOUT_MS),
        }),
      },
    ])(
      'returns false for a correct code that is $description, without recording a failed attempt',
      async ({ userOtp }) => {
        // Arrange
        userOtpRepository.getByUserId.mockResolvedValue(userOtp);

        // Act
        const isVerified = await service.verifyOtp({ userId, otp });

        // Assert
        expect(isVerified).toBe(false);
        expect(userOtpRepository.recordFailedAttempt).not.toHaveBeenCalled();
      },
    );

    it('returns false and records a failed attempt when the stored code is not a valid hash', async () => {
      // Arrange
      userOtpRepository.getByUserId.mockResolvedValue(
        buildUserOtp({ otp: 'not-a-hash' }),
      );

      // Act
      const isVerified = await service.verifyOtp({ userId, otp });

      // Assert
      expect(isVerified).toBe(false);
      expect(userOtpRepository.recordFailedAttempt).toHaveBeenCalled();
    });
  });
});
