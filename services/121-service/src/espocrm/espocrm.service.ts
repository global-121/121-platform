import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteRegistrationDto } from '../registration/dto/delete-registration.dto';
import { UpdateRegistrationDto } from '../registration/dto/update-registration.dto';
import { ErrorEnum } from '../registration/errors/registration-data.error';
import { RegistrationsService } from '../registration/registrations.service';
import { EspocrmWebhookDto } from './dto/espocrm-webhook.dto';
import { EspocrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './espocrm-entity-type';
import { EspocrmWebhookEntity } from './espocrm-webhooks.entity';

@Injectable()
export class EspocrmService {
  @InjectRepository(EspocrmWebhookEntity)
  private readonly espocrmWebhookRepository: Repository<EspocrmWebhookEntity>;

  public constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async updateRegistrations(
    updateRegistrations: UpdateRegistrationDto[],
  ): Promise<void> {
    for (const updateRegistration of updateRegistrations) {
      const referenceId = updateRegistration.id;
      for (const key in updateRegistration) {
        if (key !== 'id') {
          const value = updateRegistration[key];
          try {
            await this.registrationsService.setAttribute(
              referenceId,
              key,
              value,
            );
          } catch (error) {
            if (error.name === ErrorEnum.RegistrationDataError) {
              continue; // ignore unknown fieldnames
            } else {
              console.warn('Unknown error: ', error);
              console.log(
                `Failed updating '${key}' with value: ${value} (referenceId: ${referenceId})`,
              );
              throw error;
            }
          }
        }
      }
    }
    return;
  }

  public async deleteRegistrations(
    deleteRegistrationsDto: DeleteRegistrationDto[],
  ): Promise<void> {
    for (const deleteRegistration of deleteRegistrationsDto) {
      const referenceId = deleteRegistration.id;
      console.log('referenceId to delete: ', referenceId);
    }
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
