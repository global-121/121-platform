import { Test, TestingModule } from '@nestjs/testing';
import crypto from 'node:crypto';

import { UserApiKeyEntity } from '@121-service/src/user/user-api-keys/user-api-key.entity';
import { UserApiKeyRepository } from '@121-service/src/user/user-api-keys/user-api-key.repository';
import { UserApiKeysService } from '@121-service/src/user/user-api-keys/user-api-keys.service';

describe('UserApiKeysService', () => {
  let service: UserApiKeysService;
  let userApiKeyRepository: jest.Mocked<UserApiKeyRepository>;

  const hashApiKey = ({ apiKey }: { apiKey: string }): string =>
    crypto.createHash('sha256').update(apiKey).digest('hex');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserApiKeysService,
        {
          provide: UserApiKeyRepository,
          useValue: {
            save: jest.fn(),
            replaceForUser: jest.fn(),
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
      const { apiKey } = await service.createApiKey({ userId: 1 });

      // Assert
      expect(apiKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('stores only the SHA-256 hash of the key', async () => {
      // Act
      const { apiKey } = await service.createApiKey({ userId: 1 });

      // Assert
      expect(userApiKeyRepository.save).toHaveBeenCalledWith({
        userId: 1,
        apiKey: hashApiKey({ apiKey }),
      });
    });

    it('returns a different key on every call', async () => {
      // Act
      const { apiKey: firstApiKey } = await service.createApiKey({ userId: 1 });
      const { apiKey: secondApiKey } = await service.createApiKey({
        userId: 2,
      });

      // Assert
      expect(firstApiKey).not.toBe(secondApiKey);
    });
  });

  describe('when replacing an API key', () => {
    it('returns a new 256-bit base64url encoded key', async () => {
      // Act
      const { apiKey } = await service.replaceApiKey({ userId: 1 });

      // Assert
      expect(apiKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('replaces the stored key of the user with only the SHA-256 hash of the new key', async () => {
      // Act
      const { apiKey } = await service.replaceApiKey({ userId: 1 });

      // Assert
      expect(userApiKeyRepository.replaceForUser).toHaveBeenCalledWith({
        userId: 1,
        apiKey: hashApiKey({ apiKey }),
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
