import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { KoboAssetResponseDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset-response.dto';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

// Mock KoboMapper
jest.mock('@121-service/src/kobo/mappers/kobo.mapper');

describe('KoboApiService', () => {
  let service: KoboApiService;
  let httpService: jest.Mocked<CustomHttpService>;

  const mockAssetId = 'test-asset-id';
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

  const mockCleanedSurveyItems = [
    {
      name: 'fullName',
      type: 'text',
      label: ['What is your full name?'],
      required: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboApiService,
        {
          provide: CustomHttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KoboApiService>(KoboApiService);
    httpService = module.get(CustomHttpService);

    // Reset mocks
    jest.clearAllMocks();
    (KoboMapper.surveyItemsDtosToInterfaces as jest.Mock).mockReturnValue(
      mockCleanedSurveyItems,
    );
  });

  describe('getDeployedAssetOrThrow', () => {
    // Not FOUND scenario is already covered in integrations tests

    it('should return form definition for successful request (happy flow)', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: mockSuccessResponse,
      });

      // Act
      const result = await service.getDeployedAssetOrThrow({
        assetId: mockAssetId,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      expect(result).toEqual({
        name: 'Test Registration Form',
        survey: mockCleanedSurveyItems,
        choices: mockedChoices,
        languages: ['English (en)'],
        dateDeployed: new Date('2025-04-30T14:49:53.989148Z'),
        versionId: 'v6Y4ZtQE7MJAinjPeQCUqd',
      });
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
      let error: any;
      try {
        await service.getDeployedAssetOrThrow({
          assetId: mockAssetId,
          token: mockToken,
          baseUrl: mockBaseUrl,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toMatchInlineSnapshot(
        `"Unauthorized access to Kobo API for asset: test-asset-id. Please check if the provided token is valid."`,
      );
    });

    it('should throw HttpException for unexpected error status', async () => {
      // Arrange
      const errorDetail = 'Server error occurred';
      httpService.get.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {
          detail: errorDetail,
        },
      });

      // Act
      let error: any;
      try {
        await service.getDeployedAssetOrThrow({
          assetId: mockAssetId,
          token: mockToken,
          baseUrl: mockBaseUrl,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(
        `"Failed to fetch Kobo information: Server error occurred"`,
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
      let error: any;
      try {
        await service.getDeployedAssetOrThrow({
          assetId: mockAssetId,
          token: mockToken,
          baseUrl: mockBaseUrl,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatchInlineSnapshot(
        `"Kobo information is missing version_id or asset"`,
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
      let error: any;
      try {
        await service.getDeployedAssetOrThrow({
          assetId: mockAssetId,
          token: mockToken,
          baseUrl: mockBaseUrl,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatchInlineSnapshot(
        `"Kobo information is missing version_id or asset"`,
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
      let error: any;
      try {
        await service.getDeployedAssetOrThrow({
          assetId: mockAssetId,
          token: mockToken,
          baseUrl: mockBaseUrl,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toMatchInlineSnapshot(
        `"Unauthorized access to Kobo API for asset: test-asset-id. Please check if the provided token is valid."`,
      );
    });

    it('should use fallback for error detail when not provided', async () => {
      // Arrange
      httpService.get.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {}, // No detail field
      });

      // Act
      let error: any;
      try {
        await service.getDeployedAssetOrThrow({
          assetId: mockAssetId,
          token: mockToken,
          baseUrl: mockBaseUrl,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(
        `"Failed to fetch Kobo information: Unknown error"`,
      );
    });

    it('should handle empty asset name gracefully', async () => {
      // Arrange
      const responseWithEmptyName = {
        ...mockSuccessResponse,
        asset: {
          ...mockSuccessResponse.asset!,
          name: '',
        },
      };

      httpService.get.mockResolvedValue({
        status: HttpStatus.OK,
        data: responseWithEmptyName,
      });

      // Act
      const result = await service.getDeployedAssetOrThrow({
        assetId: mockAssetId,
        token: mockToken,
        baseUrl: mockBaseUrl,
      });

      // Assert
      expect(result.name).toBe('');
    });
  });
});
