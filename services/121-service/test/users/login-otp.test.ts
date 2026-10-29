import { HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  connectToDatabase,
  deleteStoredOtps,
  getStoredOtps,
  markStoredOtpAsUsedAndIssuedBeforeCooldown,
  requestLoginOtp,
} from '@121-service/test/helpers/user-otp.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';

describe('/ Users', () => {
  describe('/ Login OTP', () => {
    const username = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
    let dataSource: DataSource;

    beforeAll(async () => {
      await resetDB({ seedScript: SeedScript.productionInitialState });
      dataSource = await connectToDatabase();
    });

    beforeEach(async () => {
      await deleteStoredOtps({ dataSource, username });
    });

    afterAll(async () => {
      await dataSource.destroy();
    });

    it('should accept an unauthenticated request and store an unused code', async () => {
      // Act
      const response = await requestLoginOtp({ username });

      // Assert
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      expect(response.body).toEqual({});
      const storedOtps = await getStoredOtps({ dataSource, username });
      expect(storedOtps).toHaveLength(1);
      expect(storedOtps[0]).toMatchObject({
        consumedAt: null,
        failedAttempts: 0,
      });
    });

    it('should give an unknown username the same response as a known username', async () => {
      // Arrange
      const knownUsernameResponse = await requestLoginOtp({ username });

      // Act
      const unknownUsernameResponse = await requestLoginOtp({
        username: 'unknown@example.org',
      });

      // Assert
      expect(unknownUsernameResponse.status).toBe(knownUsernameResponse.status);
      expect(unknownUsernameResponse.body).toEqual(knownUsernameResponse.body);
    });

    it('should keep the stored code when the request is repeated within the cooldown', async () => {
      // Arrange
      await requestLoginOtp({ username });
      const originalOtps = await getStoredOtps({ dataSource, username });

      // Act
      const response = await requestLoginOtp({ username });

      // Assert
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      expect(await getStoredOtps({ dataSource, username })).toEqual(
        originalOtps,
      );
    });

    it('should keep the stored code when concurrent requests arrive within the cooldown', async () => {
      // Arrange
      const concurrentRequestCount = 5;
      await requestLoginOtp({ username });
      const originalOtps = await getStoredOtps({ dataSource, username });

      // Act
      const responses = await Promise.all(
        Array.from({ length: concurrentRequestCount }, () =>
          requestLoginOtp({ username }),
        ),
      );

      // Assert
      expect(responses.map((response) => response.status)).toEqual(
        Array(concurrentRequestCount).fill(HttpStatus.ACCEPTED),
      );
      expect(await getStoredOtps({ dataSource, username })).toEqual(
        originalOtps,
      );
    });

    it('should replace and reset a used code once the cooldown has passed', async () => {
      // Arrange
      await requestLoginOtp({ username });
      await markStoredOtpAsUsedAndIssuedBeforeCooldown({
        dataSource,
        username,
      });
      const [previousOtp] = await getStoredOtps({ dataSource, username });

      // Act
      const response = await requestLoginOtp({ username });

      // Assert
      expect(response.status).toBe(HttpStatus.ACCEPTED);
      const storedOtps = await getStoredOtps({ dataSource, username });
      expect(storedOtps).toHaveLength(1);
      expect(storedOtps[0].hash).not.toBe(previousOtp.hash);
      expect(storedOtps[0].issuedAt.getTime()).toBeGreaterThan(
        previousOtp.issuedAt.getTime(),
      );
      expect(storedOtps[0]).toMatchObject({
        consumedAt: null,
        failedAttempts: 0,
      });
    });
  });
});
