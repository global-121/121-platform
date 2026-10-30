import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  loginWithOtp,
  requestLoginOtp,
} from '@121-service/test/helpers/user.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';

describe('/ Users', () => {
  const knownUsername = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
  const unknownUsername = 'unknown@example.org';

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
  });

  describe('/ Login OTP request', () => {
    it('should accept an unauthenticated request', async () => {
      // Act
      const response = await requestLoginOtp({ username: knownUsername });

      // Assert
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      expect(response.body).toEqual({});
    });

    it('should give an unknown username the same response as a known username', async () => {
      // Arrange
      const knownUsernameResponse = await requestLoginOtp({
        username: knownUsername,
      });

      // Act
      const unknownUsernameResponse = await requestLoginOtp({
        username: unknownUsername,
      });

      // Assert
      expect(unknownUsernameResponse.status).toBe(knownUsernameResponse.status);
      expect(unknownUsernameResponse.body).toEqual(knownUsernameResponse.body);
    });
  });

  describe('/ Login with OTP', () => {
    it('should reject a wrong OTP without setting a cookie', async () => {
      // Arrange
      await requestLoginOtp({ username: knownUsername });

      // Act
      const response = await loginWithOtp({
        username: knownUsername,
        otp: 'WRONG1',
      });

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should give an unknown username the same response as a wrong OTP', async () => {
      // Arrange
      const wrongOtpResponse = await loginWithOtp({
        username: knownUsername,
        otp: 'WRONG1',
      });

      // Act
      const unknownUsernameResponse = await loginWithOtp({
        username: unknownUsername,
        otp: 'WRONG1',
      });

      // Assert
      expect(unknownUsernameResponse.status).toBe(wrongOtpResponse.status);
      expect(unknownUsernameResponse.body).toEqual(wrongOtpResponse.body);
    });
  });
});
