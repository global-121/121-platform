import { HttpStatus } from '@nestjs/common';
import { getServer, resetDB } from '../helpers/utility.helper';

const server = getServer();

describe('Authentication', () => {
  describe('Login', () => {
    const fixtureProgramId = 1;
    const fixtureUser = {
      username: 'full-access-user@example.org',
      password: 'password',
    };

    beforeAll(async () => {
      await resetDB('nlrc-multiple');
    });

    it('should log-in with valid credentials', async () => {
      // Arrange
      const testUser = fixtureUser;

      // Act
      const response = await server.post('/user/login').send(testUser);

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.headers['set-cookie'][0]).toMatch('access_token_');
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
      const response = await server.post('/user/login').send(testUser);

      // Assert
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body).toBeDefined();
    });
  });
});
