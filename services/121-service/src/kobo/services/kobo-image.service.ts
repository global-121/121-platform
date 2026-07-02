import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Readable } from 'node:stream';
import { lastValueFrom } from 'rxjs';
import { Equal, Repository } from 'typeorm';

import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

const ALLOWED_IMAGE_MIMETYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);

@Injectable()
export class KoboImageService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly httpService: HttpService,
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
    });

    const response = await lastValueFrom(
      this.httpService.get(imageUrl, {
        headers: { Authorization: `Token ${koboEntity.token}` },
        responseType: 'stream',
      }),
    );

    const contentType = response.headers['content-type'] as string | undefined;
    const mimetype = contentType?.split(';')[0]?.trim() ?? '';

    if (!ALLOWED_IMAGE_MIMETYPES.has(mimetype)) {
      throw new BadRequestException(`Disallowed image mimetype: ${mimetype}`);
    }

    return { stream: response.data as Readable, mimetype };
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
  }: {
    imageUrl: string;
    koboBaseUrl: string;
  }): void {
    const imageOrigin = new URL(imageUrl).origin;
    const koboOrigin = new URL(koboBaseUrl).origin;

    if (imageOrigin !== koboOrigin) {
      throw new BadRequestException(
        'Image URL does not belong to the configured Kobo server',
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
