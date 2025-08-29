import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { getServer, resetDB } from '@121-service/test/helpers/utility.helper';
import { projectIdPV } from '@121-service/test/registrations/pagination/pagination-data';

describe('/ Users', () => {
  describe('/ Login', () => {
    const fixtureProjectId = projectIdPV;
    const fixtureUser = {
      username: 'admin@example.org',
      password: 'password',
    };

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple, __filename);
    });

    it('should log-in with valid credentials', async () => {
      // Arrange
      const testUser = fixtureUser;

      // Act
      const response = await getServer().post('/users/login').send(testUser);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      const cookies = response.get('Set-Cookie');
      expect(cookies).toBeDefined(); // Ensure cookies are defined
      expect(
        cookies &&
          cookies.findIndex((cookie) => cookie.startsWith(CookieNames.general)),
      ).not.toBe(-1);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.expires).toBeDefined();
      expect(Date.parse(response.body.expires)).not.toBeNaN();
      expect(response.body.permissions).toBeDefined();
      expect(
        response.body.permissions[`${fixtureProjectId}`].length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('should not log-in with invalid credentials', async () => {
      // Arrange
      const testUser = {
        ...fixtureUser,
        password: 'wrong',
      };

      // Act
      const response = await getServer().post('/users/login').send(testUser);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body).toBeDefined();
    });
  });
});
