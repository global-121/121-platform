import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { OnafriqApiWebhookSubscribeResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-webhook-subscribe-response-body.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { CreateTransactionParams } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';

@Injectable()
export class OnafriqService implements FspIntegrationInterface {
  public constructor(private readonly onafriqApiService: OnafriqApiService) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _projectId: number,
    _paymentId: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
  }

  public async subscribeWebhook(): Promise<
    OnafriqApiWebhookSubscribeResponseBody | undefined
  > {
    return await this.onafriqApiService.subscribeWebhook();
  }

  public async createTransaction({
    transferAmount,
    phoneNumber,
    firstName,
    lastName,
    thirdPartyTransId,
  }: CreateTransactionParams): Promise<void> {
    // Simulate timeout, use this to test unintended Redis job re-attempt, by restarting 121-service during this timeout
    // 1. Simulate crash before API-call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    const mappedResponse = await this.onafriqApiService.callService({
      transferAmount,
      phoneNumber,
      firstName,
      lastName,
      thirdPartyTransId,
    });

    if (mappedResponse.status !== OnafriqApiResponseStatusType.success) {
      const errorMessage = mappedResponse.errorMessage;
      throw new OnafriqError(errorMessage!, mappedResponse.status);
    }

    // 2. Simulate crash after API call
    // await new Promise((resolve) => setTimeout(resolve, 60000));
  }
}
