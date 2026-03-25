import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { KoboAssetResponseDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset-response.dto';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

describe('KoboApiService', () => {
  let service: KoboApiService;
  let httpService: jest.Mocked<CustomHttpService>;

  const mockAssetUid = 'test-asset-id';
  const mockToken = 'test-token';
  const mockBaseUrl = 'https://kobo.example.com';

  const mockedChoices = [
    {
      name: 'great',
      $kuid: 'Op4dDqyni',
      label: ['Great', 'Geweldig'],
      list_name: 'ol0qe57',
      $autovalue: 'great',
    },
  ];

  const mockSuccessResponse: KoboAssetResponseDto = {
    version_id: 'v6Y4ZtQE7MJAinjPeQCUqd',
    asset: {
      name: 'Test Registration Form',
      content: {
        survey: [
          {
            name: 'fullName',
            type: 'text',
            label: ['What is your full name?'],
            required: true,
            $autoname: 'sdfasd',
            $xpath: '/data/fullName',
            $kuid: 'kobo-unique-id',
          },
        ],
        choices: mockedChoices,
      },
      summary: {
        languages: ['English (en)'],
      },
      date_deployed: new Date('2025-04-30T14:49:53.989148Z'),
      version_id: 'v6Y4ZtQE7MJAinjPeQCUqd',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboApiService,
        {
          provide: CustomHttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KoboApiService>(KoboApiService);
    httpService = module.get(CustomHttpService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getDeployedAssetOrThrow', () => {
    // Not FOUND scenario is already covered in integrations tests

    it('should return asset for successful request (happy flow)', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: mockSuccessResponse,
      });

      // Act
      const result = await service.getDeployedAssetOrThrow({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      expect(result).toEqual(mockSuccessResponse.asset);
    });

    it('should throw HttpException with UNAUTHORIZED status', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.UNAUTHORIZED,
        data: {
          detail: 'Invalid token',
        },
      });

      // Act
      const promise = service.getDeployedAssetOrThrow({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.UNAUTHORIZED,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Unauthorized access to Kobo API for asset: test-asset-id, url: https://kobo.example.com/api/v2/assets/test-asset-id/deployment. Please check if the provided token is valid.',
      );
    });

    it('should throw HttpException for unexpected error status', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {
          detail: 'Server error occurred',
        },
      });

      // Act
      const promise = service.getDeployedAssetOrThrow({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.BAD_REQUEST,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Failed to fetch Kobo information for asset: test-asset-id, url: https://kobo.example.com/api/v2/assets/test-asset-id/deployment: Server error occurred',
      );
    });

    it('should throw Error when response body is missing version_id', async () => {
      // Arrange
      const responseWithoutVersionId = {
        ...mockSuccessResponse,
        version_id: undefined,
      };

      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: responseWithoutVersionId,
      });

      // Act
      const promise = service.getDeployedAssetOrThrow({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeInstanceOf(Error);
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Kobo information is missing version_id or asset',
      );
    });

    it('should throw Error when response body is missing asset', async () => {
      // Arrange
      const responseWithoutAsset = {
        ...mockSuccessResponse,
        asset: undefined,
      };

      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: responseWithoutAsset,
      });

      // Act
      const promise = service.getDeployedAssetOrThrow({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeInstanceOf(Error);
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Kobo information is missing version_id or asset',
      );
    });

    it('should throw HttpException with FORBIDDEN status', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.FORBIDDEN,
        data: {
          detail: 'Access forbidden',
        },
      });

      // Act
      const promise = service.getDeployedAssetOrThrow({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.UNAUTHORIZED,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Unauthorized access to Kobo API for asset: test-asset-id, url: https://kobo.example.com/api/v2/assets/test-asset-id/deployment. Please check if the provided token is valid.',
      );
    });

    it('should use fallback for error detail when not provided', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {}, // No detail field
      });

      // Act
      const promise = service.getDeployedAssetOrThrow({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.BAD_REQUEST,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Failed to fetch Kobo information for asset: test-asset-id, url: https://kobo.example.com/api/v2/assets/test-asset-id/deployment: Unknown error',
      );
    });
  });

  describe('getExistingKoboWebhooks', () => {
    it('should return webhook endpoints for successful request when they exist', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          results: [
            {
              url: 'https://example.com/webhook1',
            },
            {
              url: 'https://example.com/webhook2',
            },
          ],
        },
      });

      // Act
      const result = await service.getExistingKoboWebhooks({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      expect(result).toEqual([
        'https://example.com/webhook1',
        'https://example.com/webhook2',
      ]);
    });

    it('should return empty array when no webhooks exist', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          results: [],
        },
      });

      // Act
      const result = await service.getExistingKoboWebhooks({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      expect(result).toBeArrayOfSize(0);
    });

    // Not all error scenarios are covered here as most of the error handling is delegated in a private function which is tested via other public methods
    it('should properly handle error responses', async () => {
      // Arrange - test that error handling is properly delegated to handleKoboApiError
      httpService.get.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {
          detail: 'Server error occurred',
        },
      });

      // Act
      const promise = service.getExistingKoboWebhooks({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.BAD_REQUEST,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Failed to fetch Kobo webhooks for asset: test-asset-id, url: https://kobo.example.com/api/v2/assets/test-asset-id/hooks: Server error occurred',
      );
    });
  });

  describe('createKoboWebhook', () => {
    it('should successfully create webhook for successful request (happy flow)', async () => {
      // Arrange
      httpService.post.mockResolvedValue({
        status: HttpStatus.CREATED,
        data: {},
      });

      // Act
      await service.createKoboWebhook({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
        webhookAuthUsername: 'test-username',
        webhookAuthPassword: 'test-password',
      });

      // Assert
      const expectedHeaders = new Headers({
        Authorization: `Token ${mockToken}`,
      });

      expect(httpService.post).toHaveBeenCalledWith(
        'https://kobo.example.com/api/v2/assets/test-asset-id/hooks/',
        {
          name: 'Create a registration in the 121 Platform when a submission is received',
          endpoint: expect.stringContaining('kobo/webhook'),
          active: true,
          subset_fields: ['_uuid', '_xform_id_string', '__version__'],
          auth_level: 'basic_auth',
          settings: { username: 'test-username', password: 'test-password' },
        },
        expectedHeaders,
      );
    });

    // Not all error scenarios are covered here as most of the error handling is delegated in a private function which is tested via other public methods
    it('should properly handle error responses', async () => {
      // Arrange - test that error handling is properly delegated to handleKoboApiError
      httpService.post.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {
          detail: 'Server error occurred',
        },
      });

      // Act
      const promise = service.createKoboWebhook({
        assetUid: mockAssetUid,
        token: mockToken,
        baseUrl: mockBaseUrl,
        webhookAuthUsername: 'test-username',
        webhookAuthPassword: 'test-password',
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.BAD_REQUEST,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Failed to create Kobo webhook for asset: test-asset-id, url: https://kobo.example.com/api/v2/assets/test-asset-id/hooks/: Server error occurred',
      );
    });
  });

  describe('getSubmission', () => {
    const mockSubmissionUuid = 'test-submission-uuid-123';
    const mockSubmissionData = {
      _id: 12345,
      _uuid: mockSubmissionUuid,
      fullName: 'John Doe',
      phoneNumber: '+1234567890',
      FSP: 'Safaricom',
      nationalId: '12345678',
    };

    it('should successfully retrieve submission for successful request (happy flow)', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: mockSubmissionData,
      });

      // Act
      const result = await service.getSubmission({
        token: mockToken,
        assetId: mockAssetUid,
        baseUrl: mockBaseUrl,
        submissionUuid: mockSubmissionUuid,
      });

      // Assert
      const expectedHeaders = new Headers({
        Authorization: `Token ${mockToken}`,
      });

      expect(httpService.get).toHaveBeenCalledWith(
        'https://kobo.example.com/api/v2/assets/test-asset-id/data/test-submission-uuid-123',
        expectedHeaders,
      );
      expect(result).toEqual(mockSubmissionData);
    });

    // Not all error scenarios are covered here as most of the error handling is delegated in a private function which is tested via other public methods
    it('should properly handle error responses', async () => {
      // Arrange - test that error handling is properly delegated to handleKoboApiError
      httpService.get.mockResolvedValue({
        status: HttpStatus.NOT_FOUND,
        data: {
          detail: 'Submission not found',
        },
      });

      // Act
      const promise = service.getSubmission({
        token: mockToken,
        assetId: mockAssetUid,
        baseUrl: mockBaseUrl,
        submissionUuid: mockSubmissionUuid,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.NOT_FOUND,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        'Kobo submission not found for asset: test-asset-id, url: https://kobo.example.com/api/v2/assets/test-asset-id/data/test-submission-uuid-123.',
      );
    });
  });

  describe('getAllSubmissions', () => {
    const mockSubmissionsData = [
      {
        _id: 1,
        _uuid: 'uuid-1',
        fullName: 'John Doe',
        phoneNumber: '+1234567890',
      },
      {
        _id: 2,
        _uuid: 'uuid-2',
        fullName: 'Jane Doe',
        phoneNumber: '+0987654321',
      },
    ];

    it('should successfully retrieve all submissions for successful request and includes limit query parameter (happy flow)', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          count: 2,
          next: null,
          previous: null,
          results: mockSubmissionsData,
        },
      });

      // Act
      const result = await service.getSubmissionsUpToLimit({
        token: mockToken,
        assetUid: mockAssetUid,
        baseUrl: mockBaseUrl,
      });

      // Assert
      const expectedHeaders = new Headers({
        Authorization: `Token ${mockToken}`,
      });

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://kobo.example.com/api/v2/assets/test-asset-id/data/',
        ),
        expectedHeaders,
      );
      expect(result).toEqual({
        count: 2,
        submissions: mockSubmissionsData,
      });
      // Check that the limit query parameter is included in the request URL
      const calledUrl = httpService.get.mock.calls[0]![0] as string;
      expect(calledUrl).toContain('limit=');
    });

    // Not all error scenarios are covered here as most of the error handling is delegated in a private function which is tested via other public methods
    it('should properly handle error responses', async () => {
      // Arrange - test that error handling is properly delegated to handleKoboApiError
      httpService.get.mockResolvedValue({
        status: HttpStatus.NOT_FOUND,
        data: {
          detail: 'Submissions not found',
        },
      });

      // Act
      const promise = service.getSubmissionsUpToLimit({
        token: mockToken,
        assetUid: mockAssetUid,
        baseUrl: mockBaseUrl,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.NOT_FOUND,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        expect.stringContaining(
          'Kobo submissions not found for asset: test-asset-id',
        ),
      );
    });
  });
});
