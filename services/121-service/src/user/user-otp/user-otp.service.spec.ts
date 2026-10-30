import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'node:crypto';

import { env } from '@121-service/src/env';
import { OTP_EXPIRATION_MS } from '@121-service/src/user/user-otp/user-otp.const';
import { UserOtpRepository } from '@121-service/src/user/user-otp/user-otp.repository';
import { UserOtpService } from '@121-service/src/user/user-otp/user-otp.service';

describe('UserOtpService', () => {
  let service: UserOtpService;
  let userOtpRepository: jest.Mocked<UserOtpRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOtpService,
        {
          provide: UserOtpRepository,
          useValue: { replaceForUser: jest.fn() },
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
      const { otp } = await service.createOtp({ userId: 1 });

      // Assert
      expect(otp).toMatch(/^[0-9A-Z]{6}$/);
    });

    it('stores an HMAC hash of the code instead of the code itself', async () => {
      // Act
      const { otp } = await service.createOtp({ userId: 1 });

      // Assert
      const expectedHash = crypto
        .createHmac('sha256', env.SECRETS_121_SERVICE_SECRET)
        .update(otp)
        .digest('hex');
      expect(userOtpRepository.replaceForUser).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, otp: expectedHash }),
      );
    });

    it('expires the code after the configured expiration time', async () => {
      // Arrange
      const now = new Date('2026-10-27T10:00:00.000Z');
      jest.useFakeTimers({ now });

      // Act
      const { expiresAt } = await service.createOtp({ userId: 1 });

      // Assert
      expect(expiresAt).toEqual(new Date(now.getTime() + OTP_EXPIRATION_MS));
    });
  });
});
