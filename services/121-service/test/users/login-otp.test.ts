import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { requestLoginOtp } from '@121-service/test/helpers/user.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';

describe('/ Users', () => {
  describe('/ Login OTP', () => {
    const knownUsername = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
    const unknownUsername = 'unknown@example.org';

    beforeAll(async () => {
      await resetDB({ seedScript: SeedScript.productionInitialState });
    });

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
});
