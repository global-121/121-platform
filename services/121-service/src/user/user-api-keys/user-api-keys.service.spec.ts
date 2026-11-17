import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'node:crypto';
import { EntityManager } from 'typeorm';

import { UserApiKeyEntity } from '@121-service/src/user/user-api-keys/user-api-key.entity';
import { UserApiKeyRepository } from '@121-service/src/user/user-api-keys/user-api-key.repository';
import { UserApiKeysService } from '@121-service/src/user/user-api-keys/user-api-keys.service';

describe('UserApiKeysService', () => {
  let service: UserApiKeysService;
  let userApiKeyRepository: jest.Mocked<UserApiKeyRepository>;

  const hashApiKey = ({ apiKey }: { apiKey: string }): string =>
    crypto.createHash('sha256').update(apiKey).digest('hex');
  const manager = {} as EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserApiKeysService,
        {
          provide: UserApiKeyRepository,
          useValue: {
            createForUser: jest.fn(),
            deleteForUser: jest.fn(),
            getByApiKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserApiKeysService);
    userApiKeyRepository = module.get(UserApiKeyRepository);
  });

  describe('when creating an API key', () => {
    it('returns a 256-bit base64url encoded key', async () => {
      // Act
      const { apiKey } = await service.createApiKey({ userId: 1, manager });

      // Assert
      expect(apiKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('stores only the SHA-256 hash of the key within the given transaction', async () => {
      // Act
      const { apiKey } = await service.createApiKey({ userId: 1, manager });

      // Assert
      expect(userApiKeyRepository.createForUser).toHaveBeenCalledWith({
        userId: 1,
        apiKey: hashApiKey({ apiKey }),
        manager,
      });
    });

    it('returns a different key on every call', async () => {
      // Act
      const { apiKey: firstApiKey } = await service.createApiKey({
        userId: 1,
        manager,
      });
      const { apiKey: secondApiKey } = await service.createApiKey({
        userId: 2,
        manager,
      });

      // Assert
      expect(firstApiKey).not.toBe(secondApiKey);
    });
  });

  describe('when deleting an API key', () => {
    it('deletes the stored key of the user', async () => {
      // Act
      await service.deleteApiKey({ userId: 1 });

      // Assert
      expect(userApiKeyRepository.deleteForUser).toHaveBeenCalledWith({
        userId: 1,
      });
    });
  });

  describe('when getting a user id by API key', () => {
    it('looks up the hash of the key and returns the user id', async () => {
      // Arrange
      const apiKey = 'test-api-key';
      userApiKeyRepository.getByApiKey.mockResolvedValue({
        userId: 3,
      } as UserApiKeyEntity);

      // Act
      const result = await service.getUserIdByApiKey({ apiKey });

      // Assert
      expect(userApiKeyRepository.getByApiKey).toHaveBeenCalledWith({
        apiKey: hashApiKey({ apiKey }),
      });
      expect(result).toEqual({ userId: 3 });
    });

    it('returns undefined when the key is unknown', async () => {
      // Arrange
      userApiKeyRepository.getByApiKey.mockResolvedValue(null);

      // Act
      const result = await service.getUserIdByApiKey({
        apiKey: 'unknown-api-key',
      });

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
