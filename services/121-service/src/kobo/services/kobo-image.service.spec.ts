import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Readable } from 'node:stream';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboImageService } from '@121-service/src/kobo/services/kobo-image.service';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

describe('KoboImageService', () => {
  let service: KoboImageService;
  let httpService: jest.Mocked<CustomHttpService>;
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
        } });

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
        status: 200,
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
      expect(httpService.getStream).toHaveBeenCalledWith(
        mockImageUrl,
        expect.any(Headers),
      );
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
      registrationsService.getRegistrationOrThrow.mockRejectedValue(
        new NotFoundException('Registration not found'),
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

    it('should throw BadRequestException when image URL origin does not match Kobo server', async () => {
      // Arrange
      const maliciousUrl = `https://evil.com/api/v2/assets/${mockAssetUid}/data/1/attachments/1`;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: maliciousUrl } as any,
      );

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when image URL does not contain the asset ID', async () => {
      // Arrange
      const urlWithWrongAsset = `${mockKoboUrl}/api/v2/assets/wrong-asset-id/data/1/attachments/1`;

      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: urlWithWrongAsset } as any,
      );

      // Act & Assert
      await expect(
        service.getKoboImageStream({
          programId: mockProgramId,
          referenceId: mockReferenceId,
          attributeName: mockAttributeName,
        }),
      ).rejects.toThrow(BadRequestException);
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
        status: 200,
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

    it('should pass the Kobo token in the Authorization header', async () => {
      // Arrange
      const mockImageUrl = `${mockKoboUrl}/api/v2/assets/${mockAssetUid}/data/1/attachments/1`;
      const mockStream = new Readable({
        read() {
          // no-op: mock stream does not produce data
        } });

      koboRepository.findOne.mockResolvedValue(mockKoboEntity);
      registrationsService.getRegistrationOrThrow.mockResolvedValue({} as any);
      programRegistrationAttributesService.getAttributes.mockResolvedValue([
        { name: mockAttributeName, type: RegistrationAttributeTypes.koboImage },
      ] as any);
      registrationsService.getOnePaginatedRegistrationByReferenceId.mockResolvedValue(
        { [mockAttributeName]: mockImageUrl } as any,
      );
      httpService.getStream.mockResolvedValue({
        headers: { 'content-type': 'image/png' },
        data: mockStream,
        status: 200,
        statusText: 'OK',
      } as any);

      // Act
      await service.getKoboImageStream({
        programId: mockProgramId,
        referenceId: mockReferenceId,
        attributeName: mockAttributeName,
      });

      // Assert
      const calledHeaders = httpService.getStream.mock.calls[0][1] as Headers;
      expect(calledHeaders.get('Authorization')).toBe(`Token ${mockToken}`);
    });
  });
});
