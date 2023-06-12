import { Injectable } from '@nestjs/common';
import axios from 'axios';
// import { SafaricomPaymentPayloadDto } from './dto/safaricom-payment-payload.dto';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';

@Injectable()
export class SafaricomService {
  public constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
    amount: number,
  ): Promise<FspTransactionResultDto> {
    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.vodacash;

    for (const payment of paymentList) {
      const calculatedAmount = amount * (payment.paymentAmountMultiplier || 1);

      const paTransactionResult = {
        fspName: FspName.vodacash,
        referenceId: payment.referenceId,
        date: new Date(),
        calculatedAmount: calculatedAmount,
        status: StatusEnum.waiting,
        message: null,
      };

      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      this.transactionsService.storeTransactionUpdateStatus(
        paTransactionResult,
        programId,
        paymentNr,
      );
    }
    return fspTransactionResult;
  }

  public async makePayment(payload: any): Promise<any> {
    console.log("TEST Safaricom Service " + process.env.SAFARICOM_B2C_PAYMENTREQUEST_URL);
    try {
      const paymentUrl = process.env.SAFARICOM_B2C_PAYMENTREQUEST_URL;
      const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
      const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;

      const accessToken = await this.getAccessToken(consumerKey, consumerSecret);
      console.log(accessToken);
      const response = await axios.post(paymentUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to make Safaricom B2C payment API call');
    }
  }

  async getAccessToken(consumerKey: string, consumerSecret: string): Promise<string> {
    const accessTokenUrl = process.env.SAFARICOM_CONSUMER_ACCESS_TOKEN_URL;

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    console.log("TEST");
    const { data } = await axios.get(accessTokenUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });

    return data.access_token;
  }
}
