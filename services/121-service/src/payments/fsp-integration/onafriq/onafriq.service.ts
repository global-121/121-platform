import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { CreateTransactionParams } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';

@Injectable()
export class OnafriqService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(private readonly onafriqApiService: OnafriqApiService) {}

  /**
   * Do not use! This function was previously used to send payments.
   * It has been deprecated and should not be called anymore.
   */
  public async sendPayment(
    _paymentList: PaPaymentDataDto[],
    _programId: number,
    _paymentNr: number,
  ): Promise<void> {
    throw new Error('Method should not be called anymore.');
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

    await this.onafriqApiService.callService({
      transferAmount,
      phoneNumber,
      firstName,
      lastName,
      thirdPartyTransId,
    });

    // 2. Simulate crash after API call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    // Update transfer record with conversation ID
    // ##TODO: for now the assumption is there is nothing to update on Onafriq Transaction Entity at this point
  }
}
