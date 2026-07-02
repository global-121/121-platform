import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import { Readable } from 'node:stream';
import { Equal, Repository } from 'typeorm';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const ALLOWED_IMAGE_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/svg',
]);

@Injectable()
export class KoboImageService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly httpService: CustomHttpService,
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

    const imageUrl = await this.getImageUrlForAttribute({
      programId,
      referenceId,
      attributeName,
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

  private async getImageUrlForAttribute({
    programId,
    referenceId,
    attributeName,
  }: {
    programId: number;
    referenceId: string;
    attributeName: string;
  }): Promise<string> {
    const registration =
      await this.registrationsService.getOnePaginatedRegistrationByReferenceId({
        referenceId,
        programId,
        select: [attributeName],
      });

    const url = registration[attributeName] as string | undefined;
    if (!url) {
      throw new NotFoundException(
        `No image stored for attribute '${attributeName}' on this registration`,
      );
    }

    return url;
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
    const imageOrigin = new URL(imageUrl).origin;
    const koboOrigin = new URL(koboBaseUrl).origin;
    const assetIdFromUrl = imageUrl.split('/').find((part) => part === assetId);

    if (imageOrigin !== koboOrigin) {
      throw new BadRequestException(
        'Image URL does not belong to the configured Kobo server',
      );
    }

    if (assetId && !assetIdFromUrl) {
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
