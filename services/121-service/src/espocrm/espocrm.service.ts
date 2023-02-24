import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatchRegistrationDto } from '../registration/dto/patch-registration.dto';
import { EspocrmWebhookDto } from './dto/espocrm-webhook.dto';
import { EspocrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './espocrm-entity-type';
import { EspocrmWebhookEntity } from './espocrm-webhooks.entity';

@Injectable()
export class EspocrmService {
  @InjectRepository(EspocrmWebhookEntity)
  private readonly espocrmWebhookRepository: Repository<EspocrmWebhookEntity>;

  public async patchRegistration(
    patchRegistrations: PatchRegistrationDto[],
  ): Promise<void> {
    console.log('patchRegistrations: ', patchRegistrations);
    return;
  }

  public async deleteRegistration(): Promise<void> {
    return;
  }

  public async getWebhook(
    actionType: EspocrmActionTypeEnum,
    entityType: EspocrEntityTypeEnum,
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
    return await this.espocrmWebhookRepository.save(data);
  }
}
