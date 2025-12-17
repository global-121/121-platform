import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('/ Users', () => {
  describe('/ Roles', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.testMultiple, __filename);
      accessToken = await getAccessToken();
    });

    it('should create roles when using valid permissions', async () => {
      // Arrange

      // Act
      const response = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: 'test-manager',
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: ['program.update', 'program:metrics.read'],
        });

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it('should not create a role when the role already exists', async () => {
      // Arrange
      const roleId = 'test-manager';

      // Act
      const response = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: roleId,
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: ['program.update', 'program:metrics.read'],
        });

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);

      // Act
      const response2 = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: roleId,
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: ['program.update', 'program:metrics.read'],
        });

      // Assert
      expect(response2.status).toBe(HttpStatus.CONFLICT);
      expect(response2.text).toMatchSnapshot();
    });

    it('should not create a role when using a permission that does not exist', async () => {
      // Arrange
      const fakePermission = 'program.make-up-my-own-permission';

      // Act
      const response = await getServer()
        .post('/roles')
        .set('Cookie', [accessToken])
        .send({
          role: 'test-manager',
          label: 'Do stuff with certain permissions',
          description: 'This is a test role',
          permissions: [
            'program.update',
            fakePermission,
            'program:metrics.read',
          ],
        });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.text).toMatchSnapshot();
    });

    it('Should return all user roles', async () => {
      // Act
      const response = await getServer()
        .get('/roles')
        .set('Cookie', [accessToken])
        .send();

      const rolesLength = response.body.length;
      const roles: string[] = [];

      for (let i = 0; i < rolesLength; i++) {
        // Sort permissions for snapshot consistency
        const role = response.body[i].role;
        roles.push(role); // Add role to the array
      }
      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(roles).toMatchSnapshot();
    });
  });
});
