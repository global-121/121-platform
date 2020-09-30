import { StatusMessageDto } from './../../shared/dto/status-message.dto';
import { Injectable } from '@nestjs/common';
import { AfricasTalkingValidationDto } from './dto/africas-talking-validation.dto';
import { AfricasTalkingNotificationDto } from './dto/africas-talking-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AfricasTalkingNotificationEntity } from './africastalking-notification.entity';
import { Repository } from 'typeorm';
import { AfricasTalkingApiService } from './api/africas-talking.api.service';

@Injectable()
export class AfricasTalkingService {
  @InjectRepository(AfricasTalkingNotificationEntity)
  public africasTalkingNotificationRepository: Repository<
    AfricasTalkingNotificationEntity
  >;
  public constructor(
    private readonly africasTalkingApiService: AfricasTalkingApiService,
  ) {}

  public async sendPayment(
    paymentList: any[],
    programId,
    installment,
  ): Promise<StatusMessageDto> {
    const payload = this.createAfricasTalkingDetails(
      paymentList,
      programId,
      installment,
    );
    return await this.africasTalkingApiService.sendPaymentMpesa(payload);
  }

  public createAfricasTalkingDetails(
    paymentList: any[],
    programId: number,
    installment: number,
  ): object {
    const payload = {
      username: process.env.AFRICASTALKING_USERNAME,
      productName: process.env.AFRICASTALKING_PRODUCT_NAME,
      recipients: [],
    };

    for (let item of paymentList) {
      const recipient = {
        phoneNumber: item.phoneNumber,
        currencyCode: process.env.AFRICASTALKING_CURRENCY_CODE,
        amount: item.amount,
        metadata: {
          programId: String(programId),
          installment: String(installment),
        },
      };
      payload.recipients.push(recipient);
    }

    return payload;
  }

  public async africasTalkingValidation(
    africasTalkingValidationData: AfricasTalkingValidationDto,
  ): Promise<any> {
    return {
      status: 'Validated', // 'Validated' or 'Failed'
    };
  }

  public async africasTalkingNotification(
    africasTalkingNotificationData: AfricasTalkingNotificationDto,
  ): Promise<void> {
    await this.africasTalkingNotificationRepository.save(
      africasTalkingNotificationData,
    );
  }
}
