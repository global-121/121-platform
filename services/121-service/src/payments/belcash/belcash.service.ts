import { TransactionsService } from '../transactions/transactions.service';
import { Injectable } from '@nestjs/common';
import { PaPaymentDataDto } from '../dto/pa-payment-data.dto';
import { FspTransactionResultDto } from '../dto/payment-transaction-result.dto';
import { FspName } from '../../fsp/financial-service-provider.entity';
import { BelcashApiService } from './belcash.api.service';

@Injectable()
export class BelcashService {
  public constructor(
    private readonly belcashApiService: BelcashApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  // NOTE: ALL BELOW IS COPIED FROM AFRICAS-TALKING. THIS MUST BE ADJUSTED TO BELCASH STILL.

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.belcash;

    for (let payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);
      const payload = this.createPayloadPerPa(
        payment,
        programId,
        paymentNr,
        calculatedAmount,
      );

      const paymentRequestResultPerPa = await this.belcashApiService.sendPaymentPerPa(
        payload,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
    }
    this.transactionsService.storeAllTransactions(
      fspTransactionResult,
      programId,
      paymentNr,
    );

    return fspTransactionResult;
  }

  public createPayloadPerPa(
    paymentData: PaPaymentDataDto,
    programId: number,
    payment: number,
    amount: number,
  ): object {
    const payload = {
      username: process.env.AFRICASTALKING_USERNAME,
      productName: process.env.AFRICASTALKING_PRODUCT_NAME,
      recipients: [],
    };

    const recipient = {
      phoneNumber: paymentData.paymentAddress,
      currencyCode: process.env.AFRICASTALKING_CURRENCY_CODE,
      amount: amount,
      metadata: {
        programId: String(programId),
        payment: String(payment),
        referenceId: String(paymentData.referenceId),
        amount: String(amount),
      },
    };
    if (process.env.AFRICASTALKING_PROVIDER_CHANNEL) {
      recipient['providerChannel'] =
        process.env.AFRICASTALKING_PROVIDER_CHANNEL;
    }
    payload.recipients.push(recipient);

    return payload;
  }
}
