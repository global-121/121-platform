import { BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Readable } from 'node:stream';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboImageService } from '@121-service/src/kobo/services/kobo-image.service';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

describe('KoboImageService', () => {
  let service: KoboImageService;
  let httpService: jest.Mocked<CustomHttpService>;
  let koboApiService: jest.Mocked<KoboApiService>;
  let registrationsService: jest.Mocked<RegistrationsService>;
  let programRegistrationAttributesService: jest.Mocked<ProgramRegistrationAttributesService>;
  let koboRepository: {
    findOne: jest.Mock;
  };

  const mockProgramId = 1;
  const mockReferenceId = 'test-reference-id';
  const mockAttributeName = 'photo';
  const mockAssetUid = 'test-asset-uid';
  const mockToken = 'test-token';
  const mockKoboUrl = 'https://kobo.example.com';

  const mockKoboEntity = {
    id: 1,
    programId: mockProgramId,
    assetUid: mockAssetUid,
    token: mockToken,
    url: mockKoboUrl,
  } as unknown as KoboEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboImageService,
        {
          provide: CustomHttpService,
          useValue: {
            getStream: jest.fn(),
          },
        },
        {
          provide: KoboApiService,
          useValue: {
            getSubmission: jest.fn(),
          },
        },
        {
          provide: RegistrationsService,
          useValue: {
            getRegistrationOrThrow: jest.fn(),
            getOnePaginatedRegistrationByReferenceId: jest.fn(),
          },
        },
        {
          provide: ProgramRegistrationAttributesService,
          useValue: {
            getAttributes: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(KoboEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KoboImageService>(KoboImageService);
    httpService = module.get(CustomHttpService);
    koboApiService = module.get(KoboApiService);
    registrationsService = module.get(RegistrationsService);
    programRegistrationAttributesService = module.get(
      ProgramRegistrationAttributesService,
    );
    koboRepository = module.get(getRepositoryToken(KoboEntity));

    jest.clearAllMocks();
  });

  describe('getKoboImageStream', () => {
    it('should stream an image successfully', async () => {
      // Arrange
      const mockImageUrl = `${mockKoboUrl}/api/v2/assets/${mockAssetUid}/data/1/attachments/1`;
      const mockStream = new Readable({
        read() {
          // no-op: mock stream does not produce data
        },
      });

      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: mockImageUrl } as any,
      );
      httpService.getStream.mockResolvedValue({
        headers: { 'content-type': 'image/jpeg' },
        data: mockStream,
        status: HttpStatus.OK,
        statusText: 'OK',
      } as any);

      // Act
      const result = await service.getKoboImageStream({
        programId: mockProgramId,
        referenceId: mockReferenceId,
        attributeName: mockAttributeName,
      });

      // Assert
      expect(result.stream).toBe(mockStream);
      expect(result.mimetype).toBe('image/jpeg');
    });

    it('should throw NotFoundException when no Kobo integration exists', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when registration does not exist', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockRejectedValue(
        new Error(
          `Unexpected error: ReferenceId '${mockReferenceId}' not found in pagination query results.`,
        ),
      );

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(
        `No registration found for referenceId '${mockReferenceId}'`,
      );
    });

    it('should throw NotFoundException when attribute is not a koboImage type', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: 'otherAttribute', type: RegistrationAttributeTypes.text },
      ] as any);

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no image URL is stored for the attribute', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: undefined } as any,
      );

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([
      {
        caseName: 'image URL origin does not match Kobo server',
        imageUrl: `https://evil.com/api/v2/assets/${mockAssetUid}/data/1/attachments/1`,
      },
      {
        caseName: 'image URL does not contain the asset ID',
        imageUrl: `${mockKoboUrl}/api/v2/assets/wrong-asset-id/data/1/attachments/1`,
      },
    ])(
      'should throw BadRequestException when $caseName',
      async ({ imageUrl }) => {
        // Arrange
        koboRepository.findOne.mockResolvedValue(mockKoboEntity);
        registrationsService.getRegistrationOrThrow.mockResolvedValue(
          {} as any,
        );
        programRegistrationAttributesService.getAttributes.mockResolvedValue([
          {
            name: mockAttributeName,
            type: RegistrationAttributeTypes.koboImage,
          },
        ] as any);
        registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
          { [mockAttributeName]: imageUrl } as any,
        );

        // Act & Assert
        await expect(
          service.getKoboImageStream({
            programId: mockProgramId,
            referenceId: mockReferenceId,
            attributeName: mockAttributeName,
          }),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it.each([
      {
        caseName: 'image URL is invalid',
        koboEntity: mockKoboEntity,
        imageUrl: 'https://[invalid-url',
        expectedErrorMessage: 'Image URL is invalid',
      },
      {
        caseName: 'Kobo base URL is invalid',
        koboEntity: {
          ...mockKoboEntity,
          url: 'https://[invalid-kobo-url',
        } as KoboEntity,
        imageUrl: `${mockKoboUrl}/api/v2/assets/${mockAssetUid}/data/1/attachments/1`,
        expectedErrorMessage: 'Kobo base URL is invalid',
      },
    ])(
      'should throw BadRequestException when $caseName',
      async ({ koboEntity, imageUrl, expectedErrorMessage }) => {
        // Arrange
        koboRepository.findOne.mockResolvedValue(koboEntity);
        registrationsService.getRegistrationOrThrow.mockResolvedValue(
          {} as any,
        );
        programRegistrationAttributesService.getAttributes.mockResolvedValue([
          {
            name: mockAttributeName,
            type: RegistrationAttributeTypes.koboImage,
          },
        ] as any);
        registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
          { [mockAttributeName]: imageUrl } as any,
        );

        // Act & Assert
        await expect(
          service.getKoboImageStream({
            programId: mockProgramId,
            referenceId: mockReferenceId,
            attributeName: mockAttributeName,
          }),
        ).rejects.toThrow(expectedErrorMessage);
      },
    );

    it('should throw NotFoundException when filename cannot be resolved from submission attachments', async () => {
      // Arrange
      const imageFilename = 'unresolvable-image.jpg';

      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: imageFilename } as any,
      );
      koboApiService.getSubmission.mockResolvedValue({
        _id: 1,
        _uuid: mockReferenceId,
        _xform_id_string: mockAssetUid,
        _submission_time: '2026-07-27T00:00:00.000Z',
        _status: 'submitted_via_web',
        __version__: 'v1',
        _attachments: [
          {
            filename: 'user/attachments/form/another-image.jpg',
            download_url: `${mockKoboUrl}/api/v2/assets/${mockAssetUid}/data/1/attachments/another-image.jpg`,
            mimetype: 'image/jpeg',
          },
        ],
      } as any);

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when response mimetype is not allowed', async () => {
      // Arrange
      const mockImageUrl = `${mockKoboUrl}/api/v2/assets/${mockAssetUid}/data/1/attachments/1`;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: mockImageUrl } as any,
      );
      httpService.getStream.mockResolvedValue({
        headers: { 'content-type': 'image/svg+xml' },
        data: new Readable({
          read() {
            // no-op: mock stream does not produce data
          },
        }),
        status: HttpStatus.OK,
        statusText: 'OK',
      } as any);

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resolve filename values via submission attachments and stream image', async () => {
      // Arrange
      const imageFilename = 'test-image.jpg';
      const resolvedDownloadUrl = `${mockKoboUrl}/api/v2/assets/${mockAssetUid}/data/1/attachments/${imageFilename}`;
      const mockStream = new Readable({
        read() {
          // no-op: mock stream does not produce data
        },
      });

      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: imageFilename } as any,
      );
      koboApiService.getSubmission.mockResolvedValue({
        _id: 1,
        _uuid: mockReferenceId,
        _xform_id_string: mockAssetUid,
        _submission_time: '2026-07-27T00:00:00.000Z',
        _status: 'submitted_via_web',
        __version__: 'v1',
        _attachments: [
          {
            filename: `user/attachments/form/${imageFilename}`,
            download_url: resolvedDownloadUrl,
            mimetype: 'image/jpeg',
          },
        ],
      } as any);
      httpService.getStream.mockResolvedValue({
        headers: { 'content-type': 'image/jpeg' },
        data: mockStream,
        status: HttpStatus.OK,
        statusText: 'OK',
      } as any);

      // Act
      const result = await service.getKoboImageStream({
        programId: mockProgramId,
        referenceId: mockReferenceId,
        attributeName: mockAttributeName,
      });

      // Assert
      expect(result.stream).toBe(mockStream);
      expect(result.mimetype).toBe('image/jpeg');
    });
  });
});
