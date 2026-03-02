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

  // Helper to create mock request
  const createMockRequest = (assetUid?: string, authHeader?: string) => ({
    body: assetUid ? { _xform_id_string: assetUid } : {},
    headers: authHeader ? { authorization: authHeader } : {},
  });

  // Helper to create execution context
  const createContext = (mockRequest: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    }) as unknown as ExecutionContext;

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

  describe('can activate', () => {
    it('should allow access with valid Basic auth credentials', async () => {
      // Arrange
      const credentials = `${mockUsername}:${mockPassword}`;
      const base64Credentials = Buffer.from(credentials).toString('base64');
      const authHeader = `Basic ${base64Credentials}`;

      const mockRequest = createMockRequest(mockAssetUid, authHeader);
      const context = createContext(mockRequest);

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when assetUid is missing from request body', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const context = createContext(mockRequest);

      // Act
      let error: any;
      try {
        await guard.canActivate(context);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    });

    it('should deny access when kobo entity is not found', async () => {
      // Arrange
      const mockRequest = createMockRequest(mockAssetUid);
      const context = createContext(mockRequest);

      koboRepository.findOne.mockResolvedValue(null);

      // Act
      let error: any;
      try {
        await guard.canActivate(context);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.UNAUTHORIZED);
    });

    it('should deny access when Authorization header is missing', async () => {
      // Arrange
      const mockRequest = createMockRequest(mockAssetUid);
      const context = createContext(mockRequest);

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act
      let error: any;
      try {
        await guard.canActivate(context);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.UNAUTHORIZED);
    });

    it('should deny access when Basic auth header format is invalid', async () => {
      // Arrange
      const mockRequest = createMockRequest(
        mockAssetUid,
        'Bearer invalid-token',
      );
      const context = createContext(mockRequest);

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act
      let error: any;
      try {
        await guard.canActivate(context);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.UNAUTHORIZED);
    });

    it('should deny access when Basic auth credentials do not contain colon separator', async () => {
      // Arrange
      const noColonCredentials = 'testuser'; // Missing colon and password
      const base64Credentials =
        Buffer.from(noColonCredentials).toString('base64');
      const authHeader = `Basic ${base64Credentials}`;

      const mockRequest = createMockRequest(mockAssetUid, authHeader);
      const context = createContext(mockRequest);

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act
      let error: any;
      try {
        await guard.canActivate(context);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.UNAUTHORIZED);
    });

    it('should deny access when credentials do not match stored credentials', async () => {
      // Arrange
      const credentials = `wronguser:wrongpassword`;
      const base64Credentials = Buffer.from(credentials).toString('base64');
      const authHeader = `Basic ${base64Credentials}`;

      const mockRequest = createMockRequest(mockAssetUid, authHeader);
      const context = createContext(mockRequest);

      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);

      // Act
      let error: any;
      try {
        await guard.canActivate(context);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.UNAUTHORIZED);
    });
  });
});
