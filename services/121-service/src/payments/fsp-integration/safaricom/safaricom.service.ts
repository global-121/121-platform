import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-params.interface';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.service';

@Injectable()
export class SafaricomService implements FspIntegrationInterface {
  public constructor(
    private readonly safaricomApiService: SafaricomApiService,
    private readonly safaricomTransferScopedRepository: SafaricomTransferScopedRepository,
  ) {}

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

  public async doTransfer({
    transferAmount,
    phoneNumber,
    idNumber,
    originatorConversationId,
  }: DoTransferParams): Promise<void> {
    // Simulate timeout, use this to test unintended Redis job re-attempt, by restarting 121-service during this timeout
    // 1. Simulate crash before API-call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    const transferResult = await this.safaricomApiService.transfer({
      transferAmount,
      phoneNumber,
      idNumber,
      originatorConversationId,
    });

    // 2. Simulate crash after API call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    // Update transfer record with conversation ID
    await this.safaricomTransferScopedRepository.update(
      { originatorConversationId },
      { mpesaConversationId: transferResult.mpesaConversationId },
    );
  }
}
