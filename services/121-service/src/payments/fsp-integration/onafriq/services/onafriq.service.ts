import { Injectable } from '@nestjs/common';

import { OnafriqApiWebhookSubscribeResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-webhook-subscribe-response-body.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { CreateTransactionParams } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';

@Injectable()
export class OnafriqService {
  public constructor(private readonly onafriqApiService: OnafriqApiService) {}

  public async subscribeWebhook(): Promise<
    OnafriqApiWebhookSubscribeResponseBody | undefined
  > {
    return await this.onafriqApiService.subscribeWebhook();
  }

  public async createTransaction({
    transferAmount,
    phoneNumberPayment,
    firstName,
    lastName,
    thirdPartyTransId,
  }: CreateTransactionParams): Promise<void> {
    // Simulate timeout, use this to test unintended Redis job re-attempt, by restarting 121-service during this timeout
    // 1. Simulate crash before API-call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    const mappedResponse = await this.onafriqApiService.callService({
      transferAmount,
      phoneNumberPayment,
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
