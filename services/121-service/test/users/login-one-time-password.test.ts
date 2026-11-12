import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  loginWithOneTimePassword,
  requestLoginOneTimePassword,
} from '@121-service/test/helpers/user.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';

describe('/ Users', () => {
  const knownUsername = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
  const unknownUsername = 'unknown@example.org';

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
  });

  describe('/ Login one-time password request', () => {
    it('should accept an unauthenticated request', async () => {
      // Act
      const response = await requestLoginOneTimePassword({ username: knownUsername });

      // Assert
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      expect(response.body).toEqual({});
    });

    it('should give an unknown username the same response as a known username', async () => {
      // Arrange
      const knownUsernameResponse = await requestLoginOneTimePassword({
        username: knownUsername,
      });

      // Act
      const unknownUsernameResponse = await requestLoginOneTimePassword({
        username: unknownUsername,
      });

      // Assert
      expect(unknownUsernameResponse.status).toBe(knownUsernameResponse.status);
      expect(unknownUsernameResponse.body).toEqual(knownUsernameResponse.body);
    });
  });

  describe('/ Login with one-time password', () => {
    it('should reject a wrong one-time password without setting a cookie', async () => {
      // Arrange
      await requestLoginOneTimePassword({ username: knownUsername });
      // The one-time password is created in the background after the request is accepted
      // this risk of flakiness is acceptable here since it provides security
      await waitFor(500);

      // Act
      const response = await loginWithOneTimePassword({
        username: knownUsername,
        oneTimePassword: 'WRONG1',
      });

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('should give an unknown username the same response as a wrong one-time password', async () => {
      // Arrange
      const wrongOneTimePasswordResponse = await loginWithOneTimePassword({
        username: knownUsername,
        oneTimePassword: 'WRONG1',
      });

      // Act
      const unknownUsernameResponse = await loginWithOneTimePassword({
        username: unknownUsername,
        oneTimePassword: 'WRONG1',
      });

      // Assert
      expect(unknownUsernameResponse.status).toBe(wrongOneTimePasswordResponse.status);
      expect(unknownUsernameResponse.body).toEqual(wrongOneTimePasswordResponse.body);
    });
  });
});
