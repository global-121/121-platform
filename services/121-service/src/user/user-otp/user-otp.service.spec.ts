import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { CreateOtpResult } from '@121-service/src/user/user-otp/interfaces/create-otp-result.interface';
import {
  OTP_EXPIRATION_MS,
  OTP_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-otp/user-otp.const';
import { UserOtpRepository } from '@121-service/src/user/user-otp/user-otp.repository';
import { UserOtpService } from '@121-service/src/user/user-otp/user-otp.service';

describe('UserOtpService', () => {
  let service: UserOtpService;
  let userOtpRepository: jest.Mocked<UserOtpRepository>;

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
            replaceForUserIfIssuedBefore: jest.fn().mockResolvedValue(true),
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
      const expectedHash = crypto
        .createHmac('sha256', env.SECRETS_121_SERVICE_SECRET)
        .update(otp)
        .digest('hex');
      expect(
        userOtpRepository.replaceForUserIfIssuedBefore,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, otp: expectedHash }),
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
        userOtpRepository.replaceForUserIfIssuedBefore,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          issuedAt: now,
          previousIssuedBefore: new Date(
            now.getTime() - OTP_REISSUE_COOLDOWN_MS,
          ),
        }),
      );
    });

    it('returns no code when the previous code was issued within the cooldown', async () => {
      // Arrange
      userOtpRepository.replaceForUserIfIssuedBefore.mockResolvedValue(false);

      // Act
      const createOtpResult = await service.createOtp({ userId: 1 });

      // Assert
      expect(createOtpResult).toBeUndefined();
    });
  });
});
