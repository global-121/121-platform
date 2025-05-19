import { Injectable } from '@nestjs/common';

import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { AirtelDisbursementScopedRepository } from '@121-service/src/payments/fsp-integration/airtel/repositories/airtel-disbursement.scoped.repository';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';

@Injectable()
export class AirtelService
  implements FinancialServiceProviderIntegrationInterface
{
  public constructor(
    private readonly airtelApiService: AirtelApiService,
    private readonly airtelDisbursementScopedRepository: AirtelDisbursementScopedRepository,
  ) {}

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

  public async doDisbursement(): Promise<void> {
    // ## TODO: implement
  }

  public async doEnquiry(): Promise<void> {
    // ## TODO: implement
  }
}
