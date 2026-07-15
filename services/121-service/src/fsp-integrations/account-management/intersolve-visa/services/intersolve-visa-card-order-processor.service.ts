import { Injectable } from '@nestjs/common';

import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';
import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaApiError } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaCardOrderRepository } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/repositories/intersolve-visa-card-order.repository';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';

@Injectable()
export class IntersolveVisaCardOrderProcessorService {
  public constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly cardOrderRepository: IntersolveVisaCardOrderRepository,
  ) {}

  public async processCardOrder({
    order,
    brandCode,
    coverLetterCode,
  }: {
    order: VisaCardOrderEntity;
    brandCode: string;
    coverLetterCode: string;
  }): Promise<void> {
    await this.issueCards({ order, brandCode, coverLetterCode });

    await this.cardOrderRepository.updateStatus({
      orderId: order.id,
      status: VisaCardOrderStatus.Completed,
    });
  }

  private async issueCards({
    order,
    brandCode,
    coverLetterCode,
  }: {
    order: VisaCardOrderEntity;
    brandCode: string;
    coverLetterCode: string;
  }): Promise<void> {
    if (!order.addresseePhoneNumber) {
      throw new Error(
        `Card order ${order.id} is missing addresseePhoneNumber`,
      );
    }

    const contactInformation: ContactInformation = {
      name: order.addressee,
      addressStreet: order.addressStreet,
      addressHouseNumber: order.addressHouseNumber,
      addressHouseNumberAddition: order.addressHouseNumberAddition ?? undefined,
      addressPostalCode: order.addressPostalCode,
      addressCity: order.addressCity,
      phoneNumber: order.addresseePhoneNumber,
    };

    let cardsSentByIntersolve = 0;

    for (let index = 0; index < order.noOfCards; index++) {
      try {
        await this.intersolveVisaService.issueTokenAndCreatePhysicalCard({
          brandCode,
          coverLetterCode,
          contactInformation,
        });
        cardsSentByIntersolve += 1;
        await this.cardOrderRepository.updateProgress({
          orderId: order.id,
          noOfCardsOrdered: cardsSentByIntersolve,
        });
      } catch (error) {
        if (error instanceof IntersolveVisaApiError) {
          continue;
        }
        throw error;
      }
    }
  }
}
