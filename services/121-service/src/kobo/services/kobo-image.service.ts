import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Equal, Repository } from 'typeorm';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const ALLOWED_IMAGE_MIMETYPES = new Set(['image/jpeg', 'image/png']);

@Injectable()
export class KoboImageService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly httpService: CustomHttpService,
    private readonly koboApiService: KoboApiService,
    private readonly registrationsService: RegistrationsService,
    private readonly programRegistrationAttributesService: ProgramRegistrationAttributesService,
  ) {}

  /**
   * Fetches and streams a single Kobo image for the given registration attribute.
   * Validates that the image URL belongs to the program's Kobo asset to prevent SSRF.
   */
  public async getKoboImageStream({
    programId,
    referenceId,
    attributeName,
  }: {
    programId: number;
    referenceId: string;
    attributeName: string;
  }): Promise<{ stream: Readable; mimetype: string }> {
    const koboEntity = await this.koboRepository.findOne({
      where: { programId: Equal(programId) },
    });
    if (!koboEntity) {
      throw new NotFoundException('No Kobo integration found for this program');
    }

    await this.validateAttributeIsKoboImage({ programId, attributeName });

    const imageValue = await this.getImageValueForAttribute({
      programId,
      referenceId,
      attributeName,
    });

    const imageUrl = this.isResolvedDownloadUrl(imageValue)
      ? imageValue
      : await this.resolveImageDownloadUrlOrThrow({
          imageValue,
          referenceId,
          koboUrl: koboEntity.url,
          koboToken: koboEntity.token,
          assetId: koboEntity.assetUid,
        });

    this.validateUrlBelongsToKoboAsset({
      imageUrl,
      koboBaseUrl: koboEntity.url,
      assetId: koboEntity.assetUid,
    });

    const headers = new Headers({
      Authorization: `Token ${koboEntity.token}`,
    });

    const response = await this.httpService.getStream<AxiosResponse<Readable>>(
      imageUrl,
      headers,
    );

    const contentType = response.headers['content-type'] as string | undefined;
    const mimetype = contentType?.split(';')[0]?.trim() ?? '';

    if (!ALLOWED_IMAGE_MIMETYPES.has(mimetype)) {
      throw new BadRequestException(`Disallowed image mimetype: ${mimetype}`);
    }

    return { stream: response.data, mimetype };
  }

  private async validateAttributeIsKoboImage({
    programId,
    attributeName,
  }: {
    programId: number;
    attributeName: string;
  }): Promise<void> {
    const koboImageAttributeNames =
      await this.getProgramKoboImageAttributeNames({ programId });

    if (!koboImageAttributeNames.includes(attributeName)) {
      throw new NotFoundException(
        `Attribute '${attributeName}' is not a koboImage attribute of this program`,
      );
    }
  }

  private async getImageValueForAttribute({
    programId,
    referenceId,
    attributeName,
  }: {
    programId: number;
    referenceId: string;
    attributeName: string;
  }): Promise<string> {
    let registration: MappedPaginatedRegistrationDto;
    try {
      registration =
        await this.registrationsService.getOnePaginatedRegistrationByReferenceId(
          {
            referenceId,
            programId,
            select: [attributeName],
          },
        );
    } catch {
      throw new NotFoundException(
        `No registration found for referenceId '${referenceId}'`,
      );
    }

    const imageValue = registration[attributeName] as string | undefined;
    if (!imageValue) {
      throw new NotFoundException(
        `No image stored for attribute '${attributeName}' on this registration`,
      );
    }

    return imageValue;
  }

  private async resolveImageDownloadUrlOrThrow({
    imageValue,
    referenceId,
    koboUrl,
    koboToken,
    assetId,
  }: {
    imageValue: string;
    referenceId: string;
    koboUrl: string;
    koboToken: string;
    assetId: string;
  }): Promise<string> {
    const filename = path.basename(imageValue);
    if (!filename) {
      throw new BadRequestException('Image filename is invalid');
    }

    const submission = await this.koboApiService.getSubmission({
      token: koboToken,
      assetId,
      baseUrl: koboUrl,
      submissionUuid: referenceId,
    });

    const attachments = submission._attachments ?? [];
    const matchingAttachment = attachments.find((attachment) =>
      attachment.filename.endsWith(filename),
    );

    if (!matchingAttachment) {
      throw new NotFoundException(
        `No matching attachment found for image filename '${filename}' in Kobo submission`,
      );
    }

    return matchingAttachment.download_url;
  }

  private isResolvedDownloadUrl(imageValue: string): boolean {
    return (
      imageValue.startsWith('http://') || imageValue.startsWith('https://')
    );
  }

  private validateUrlBelongsToKoboAsset({
    imageUrl,
    koboBaseUrl,
    assetId,
  }: {
    imageUrl: string;
    koboBaseUrl: string;
    assetId: string;
  }): void {
    let imageOrigin: string;
    let koboOrigin: string;

    try {
      imageOrigin = new URL(imageUrl).origin;
    } catch {
      throw new BadRequestException('Image URL is invalid');
    }

    try {
      koboOrigin = new URL(koboBaseUrl).origin;
    } catch {
      throw new BadRequestException('Kobo base URL is invalid');
    }

    if (imageOrigin !== koboOrigin) {
      throw new BadRequestException(
        'Image URL does not belong to the configured Kobo server',
      );
    }

    const hasAssetIdInUrl = imageUrl.split('/').includes(assetId);

    if (assetId && !hasAssetIdInUrl) {
      throw new BadRequestException(
        `Image URL does not contain the expected asset ID: ${assetId}`,
      );
    }
  }

  private async getProgramKoboImageAttributeNames({
    programId,
  }: {
    programId: number;
  }): Promise<string[]> {
    const attributes =
      await this.programRegistrationAttributesService.getAttributes({
        programId,
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });

    return attributes
      .filter((attr) => attr.type === RegistrationAttributeTypes.koboImage)
      .map((attr) => attr.name);
  }
}
