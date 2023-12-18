import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { CookieNames } from '../../src/shared/enum/cookie.enums';
import { getServer, resetDB } from '../helpers/utility.helper';

describe('Authentication', () => {
  describe('Login', () => {
    const fixtureProgramId = 1;
    const fixtureUser = {
      username: 'admin@example.org',
      password: 'password',
    };

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
    });

    it('should log-in with valid credentials', async () => {
      // Arrange
      const testUser = fixtureUser;

      // Act
      const response = await getServer().post('/users/login').send(testUser);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(
        response
          .get('Set-Cookie')
          .findIndex((cookie) => cookie.startsWith(CookieNames.general)),
      ).not.toBe(-1);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.expires).toBeDefined();
      expect(Date.parse(response.body.expires)).not.toBeNaN();
      expect(response.body.permissions).toBeDefined();
      expect(
        response.body.permissions[`${fixtureProgramId}`].length,
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
