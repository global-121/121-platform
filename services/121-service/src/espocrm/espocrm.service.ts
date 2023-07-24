import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteRegistrationDto } from '../registration/dto/delete-registration.dto';
import { RegistrationsService } from '../registration/registrations.service';
import { EspocrmWebhookDto } from './dto/espocrm-webhook.dto';
import { EspoCrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from './espocrm-entity-type';
import { EspocrmWebhookEntity } from './espocrm-webhooks.entity';

@Injectable()
export class EspocrmService {
  @InjectRepository(EspocrmWebhookEntity)
  private readonly espocrmWebhookRepository: Repository<EspocrmWebhookEntity>;

  public constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async deleteRegistrations(
    deleteRegistrationsDto: DeleteRegistrationDto[],
  ): Promise<void> {
    const errors = [];
    for (const deleteRegistration of deleteRegistrationsDto) {
      const referenceId = deleteRegistration.id;
      try {
        await this.registrationsService.deleteBatch({
          referenceIds: [referenceId],
        });
      } catch (error) {
        console.log(
          `Failed deleting registration with referenceId: ${referenceId}. Error: ${error}`,
        );
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw errors[0];
    }
    return;
  }

  public async getWebhook(
    actionType: EspoCrmActionTypeEnum,
    entityType: EspoCrmEntityTypeEnum,
  ): Promise<EspocrmWebhookEntity> {
    const espocrmWebhook = await this.espocrmWebhookRepository.findOne({
      where: { actionType: actionType, entityType: entityType },
    });
    if (espocrmWebhook) {
      return espocrmWebhook;
    }
  }

  public async postWebhookIntegration(
    data: EspocrmWebhookDto,
  ): Promise<EspocrmWebhookEntity> {
    const webhook = await this.getWebhook(data.actionType, data.entityType);
    if (webhook) {
      webhook.secretKey = data.secretKey;
      webhook.referenceId = data.referenceId;
      return await this.espocrmWebhookRepository.save(webhook);
    } else {
      return await this.espocrmWebhookRepository.save(data);
    }
  }
}
