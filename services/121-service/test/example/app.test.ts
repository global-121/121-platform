import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { getHostname } from '../helpers/helper';

const server = request.agent(getHostname());

describe('App (e2e)', () => {
  describe('HealthModule', () => {
    it('should show "up"', async () => {
      // Arrange
      // Act
      const response = await server.get('/health/health').expect(HttpStatus.OK);

      // Assert
      expect(response.body.details.database.status).toEqual('up');
    });
  });

  describe('User', () => {
    const fixtureProgramId = 1;
    const fixtureUser = {
      username: 'full-access-user@example.org',
      password: 'password',
    };

    beforeAll(async () => {
      // call reset endpoint...
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
