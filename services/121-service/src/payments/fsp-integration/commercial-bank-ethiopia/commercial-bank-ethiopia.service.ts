import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { ProgramFspConfigurationEntity } from '../../../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { CommercialBankEthiopiaApiService } from './commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaTransferPayload } from './dto/commercial-bank-ethiopia-transfer-payload.dto';

@Injectable()
export class CommercialBankEthiopiaService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramFspConfigurationEntity)
  public programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;

  public constructor(
    private readonly commercialBankEthiopiaApiService: CommercialBankEthiopiaApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const config = await this.programFspConfigurationRepository
      .createQueryBuilder('fspConfig')
      .select('name')
      .addSelect('value')
      .where('fspConfig.programId = :programId', { programId })
      .andWhere('fsp.fsp = :fspName', { fspName: paymentList[0].fspName })
      .leftJoin('fspConfig.fsp', 'fsp')
      .getRawMany();

    const credentials: { username: string; password: string } = {
      username: config.find((c) => c.name === 'username')?.value,
      password: config.find((c) => c.name === 'password')?.value,
    };

    const program = await this.programRepository.findOneBy({
      id: programId,
    });

    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.safaricom;

    const referenceIds = paymentList.map((payment) => payment.referenceId);
    const userInfo = await this.getUserInfo(referenceIds);

    for (const payment of paymentList) {
      const resultUser = await this.getObjectByReferenceId(payment, userInfo);

      const payload = this.createPayloadPerPa(payment, resultUser, program);

      const paymentRequestResultPerPa = await this.sendPaymentPerPa(
        payload,
        payment.referenceId,
        credentials,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
      // Storing the per payment so you can continiously seed updates of transactions in HO-Portal
      await this.transactionsService.storeTransactionUpdateStatus(
        paymentRequestResultPerPa,
        programId,
        paymentNr,
      );
    }
    return fspTransactionResult;
  }

  public async getObjectByReferenceId(
    payment: any,
    data: any,
  ): Promise<
    [
      {
        referenceId: string;
        programname?: string;
        fspname?: string;
        value: string;
        debitTheIrRef?: string;
      },
    ]
  > {
    const results = data.filter(
      (item) => item.referenceId === payment.referenceId,
    );

    if (payment.transactionId) {
      const transaction = await this.transactionRepository.findOneBy({
        id: payment.transactionId,
      });
      const customData = {
        ...transaction.customData,
      };
      results[0].debitTheIrRef = customData['requestResult'].debitTheIrRef;
    }

    return results;
  }

  public async getUserInfo(referenceIds: string[]): Promise<any> {
    const results = await this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        'registration.referenceId AS "referenceId"',
        'data.value AS value',
        'programQuestion.name AS programName',
        'fspQuestion.name AS fspName',
      ])
      .where('registration.referenceId IN (:...referenceIds)', {
        referenceIds: referenceIds,
      })
      .andWhere(
        'programQuestion.name IN (:...names) OR fspQuestion.name IN (:...names)',
        {
          names: ['name', 'bankAccountNumber'],
        },
      )
      .leftJoin('registration.data', 'data')
      .leftJoin('data.programQuestion', 'programQuestion')
      .leftJoin('data.fspQuestion', 'fspQuestion')
      .getRawMany();

    // Filter out properties with null values from each object
    const filteredResults = results.map((result) => {
      for (const key in result) {
        if (result.hasOwnProperty(key) && result[key] === null) {
          delete result[key];
        }
      }
      return result;
    });

    return filteredResults;
  }

  public createPayloadPerPa(
    payment,
    userInfo: [
      {
        programname?: string;
        fspname?: string;
        value: string;
        referenceId: string;
        debitTheIrRef?: string;
      },
    ],
    program,
  ): CommercialBankEthiopiaTransferPayload {
    let name;
    let bankAccountNumber;
    let debitTheIrRefRetry;

    userInfo.forEach((info) => {
      if (info.programname === 'name') {
        name = info.value;
      } else if (info.fspname === 'bankAccountNumber') {
        bankAccountNumber = info.value;
      }

      if (info.debitTheIrRef) {
        debitTheIrRefRetry = info.debitTheIrRef;
      }
    });

    function padTo2Digits(num: number): string {
      return num.toString().padStart(2, '0');
    }

    function formatDate(date: Date): string {
      return [
        date.getFullYear().toString().substring(2),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('');
    }

    const payload = {
      debitAmount: payment.transactionAmount,
      debitTheIrRef:
        debitTheIrRefRetry ||
        `${formatDate(new Date())}${this.generateRandomNumerics(10)}`,
      creditTheIrRef: program.ngo,
      creditAcctNo: bankAccountNumber,
      creditCurrency: program.currency,
      remitterName: program.ngo,
      beneficiaryName: `${name}`,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: any,
    referenceId: string,
    credentials,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = FspName.commercialBankEthiopia;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.debitAmount;

    let result = await this.commercialBankEthiopiaApiService.creditTransfer(
      payload,
      credentials,
    );

    console.log(result, 'sendPaymentPerPa');
    if (result.resultDescription === 'Transaction is DUPLICATED') {
      result = await this.sendDuplicatePaymentPerPa(payload, credentials);
    }

    if (result && result.Status.successIndicator._text === 'Success') {
      paTransactionResult.status = StatusEnum.success;
      payload.status = StatusEnum.success;
    } else {
      paTransactionResult.status = StatusEnum.error;
      paTransactionResult.message = result.resultDescription;
    }

    paTransactionResult.customData = {
      requestResult: payload,
      paymentResult: result,
    };
    return paTransactionResult;
  }

  public async sendDuplicatePaymentPerPa(
    payload: any,
    credentials,
  ): Promise<any> {
    return await this.commercialBankEthiopiaApiService.transactionStatus(
      payload,
      credentials,
    );
  }

  private generateRandomNumerics(length: number): string {
    const alphanumericCharacters = '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(
        Math.random() * alphanumericCharacters.length,
      );
      result += alphanumericCharacters.charAt(randomIndex);
    }

    return result;
  }
}
