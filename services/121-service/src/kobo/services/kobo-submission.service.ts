import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';

@Injectable()
export class KoboSubmissionService {
  @InjectRepository(KoboEntity)
  private readonly koboRepository: Repository<KoboEntity>;

  constructor(
    private readonly koboApiService: KoboApiService,
    private readonly registrationsImportService: RegistrationsImportService,
  ) {}

  public async processKoboWebhookCall(
    koboWebhookIncomingSubmission: KoboWebhookIncomingSubmission,
  ): Promise<void> {
    const koboEntity = await this.koboRepository.findOne({
      where: {
        assetUid: Equal(koboWebhookIncomingSubmission._xform_id_string),
      },
      select: {
        id: true,
        assetUid: true,
        versionId: true,
        token: true,
        url: true,
      },
      relations: { program: true },
    });
    if (!koboEntity) {
      throw new HttpException(
        'Kobo integration not found for this program',
        HttpStatus.NOT_FOUND,
      );
    }

    const submission = await this.koboApiService.getSubmission({
      token: koboEntity.token,
      assetId: koboEntity.assetUid,
      baseUrl: koboEntity.url,
      submissionUuid: koboWebhookIncomingSubmission._uuid,
    });
    const registrationData = KoboMapper.mapSubmissionToRegistrationData({
      koboSubmission: submission,
    });

    await this.registrationsImportService.importRegistrations({
      inputRegistrations: [registrationData],
      program: koboEntity.program,
      userId: null,
    });
  }
}
