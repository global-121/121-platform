import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboWebhookBasicAuthGuard } from '@121-service/src/kobo/guards/kobo-webhook-basic-auth.guard';

describe('KoboWebhookBasicAuthGuard', () => {
  let guard: KoboWebhookBasicAuthGuard;
  let koboRepository: jest.Mocked<Repository<KoboEntity>>;

  const mockAssetUid = 'test-asset-123';
  const mockUsername = 'testuser';
  const mockPassword = 'testpassword';
  const mockKoboEntity: Partial<KoboEntity> = {
    webhookAuthUsername: mockUsername,
    webhookAuthPassword: mockPassword,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboWebhookBasicAuthGuard,
        {
          provide: getRepositoryToken(KoboEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<KoboWebhookBasicAuthGuard>(KoboWebhookBasicAuthGuard);
    koboRepository = module.get(getRepositoryToken(KoboEntity));
  });

  describe('canActivate', () => {
    it('should allow access with valid Basic auth credentials', async () => {
      // Arrange
      const credentials = `${mockUsername}:${mockPassword}`;
      const base64Credentials = Buffer.from(credentials).toString('base64');
      const authHeader = `Basic ${base64Credentials}`;

      const mockRequest = {
        body: { _xform_id_string: mockAssetUid },
        headers: { authorization: authHeader },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when assetUid is missing from request body', async () => {
      // Arrange
      const mockRequest = {
        body: {},
        headers: {},
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: 'Bad request',
      });
    });

    it('should deny access when kobo entity is not found', async () => {
      // Arrange
      const mockRequest = {
        body: { _xform_id_string: mockAssetUid },
        headers: {},
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      koboRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    });

    it('should deny access when Authorization header is missing', async () => {
      // Arrange
      const mockRequest = {
        body: { _xform_id_string: mockAssetUid },
        headers: {},
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    });

    it('should deny access when Basic auth header format is invalid', async () => {
      // Arrange
      const mockRequest = {
        body: { _xform_id_string: mockAssetUid },
        headers: { authorization: 'Bearer invalid-token' },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    });

    it('should deny access when Basic auth credentials do not contain colon separator', async () => {
      // Arrange
      const noColonCredentials = 'testuser'; // Missing colon and password
      const base64Credentials =
        Buffer.from(noColonCredentials).toString('base64');
      const authHeader = `Basic ${base64Credentials}`;

      const mockRequest = {
        body: { _xform_id_string: mockAssetUid },
        headers: { authorization: authHeader },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    });

    it('should deny access when credentials do not match stored credentials', async () => {
      // Arrange
      const credentials = `wronguser:wrongpassword`;
      const base64Credentials = Buffer.from(credentials).toString('base64');
      const authHeader = `Basic ${base64Credentials}`;

      const mockRequest = {
        body: { _xform_id_string: mockAssetUid },
        headers: { authorization: authHeader },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      });
    });
  });
});
