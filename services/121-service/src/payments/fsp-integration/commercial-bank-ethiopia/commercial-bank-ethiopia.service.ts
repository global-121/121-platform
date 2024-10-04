import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import Redis from 'ioredis';
import { Equal, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import {
  ProcessNamePayment,
  QueueNamePayment,
} from '@121-service/src/payments/enum/queue.names.enum';
import { CommercialBankEthiopiaApiService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaJobDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-job.dto';
import {
  CommercialBankEthiopiaRegistrationData,
  CommercialBankEthiopiaTransferPayload,
  CommercialBankEthiopiaValidationData,
} from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis-client';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class CommercialBankEthiopiaService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(RegistrationEntity)
  public registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramFspConfigurationEntity)
  public programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;
  @Inject(
    getScopedRepositoryProviderName(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
  )
  private readonly commercialBankEthiopiaAccountEnquiriesScopedRepo: ScopedRepository<CommercialBankEthiopiaAccountEnquiriesEntity>;

  public constructor(
    @InjectQueue(QueueNamePayment.paymentCommercialBankEthiopia)
    private readonly commercialBankEthiopiaQueue: Queue,
    private readonly commercialBankEthiopiaApiService: CommercialBankEthiopiaApiService,
    private readonly transactionsService: TransactionsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const credentials: { username: string; password: string } =
      await this.getCommercialBankEthiopiaCredentials(programId);

    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });

    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName =
      FinancialServiceProviderName.commercialBankEthiopia;

    const referenceIds = paPaymentList.map(
      (paPayment) => paPayment.referenceId,
    );
    const registrationData = await this.getRegistrationData(referenceIds);

    for (const paPayment of paPaymentList) {
      const paRegistrationData = await this.getPaRegistrationData(
        paPayment,
        registrationData,
      );

      const payload = this.createPayloadPerPa(
        paPayment,
        paRegistrationData,
        program,
      );

      const jobData: CommercialBankEthiopiaJobDto = {
        paPaymentData: paPayment,
        paymentNr,
        programId,
        payload,
        credentials,
        userId: paPayment.userId,
      };
      const job = await this.commercialBankEthiopiaQueue.add(
        ProcessNamePayment.sendPayment,
        jobData,
      );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
    return fspTransactionResult;
  }

  public async getQueueProgress(programId?: number): Promise<number> {
    if (programId) {
      // Get the count of job IDs in the Redis set for the program
      const count = await this.redisClient.scard(getRedisSetName(programId));
      return count;
    } else {
      // If no programId is provided, use Bull's method to get the total delayed count
      // This requires an instance of the Bull queue
      const delayedCount =
        await this.commercialBankEthiopiaQueue.getDelayedCount();
      return delayedCount;
    }
  }

  async processQueuedPayment(
    data: CommercialBankEthiopiaJobDto,
  ): Promise<void> {
    const paymentRequestResultPerPa = await this.sendPaymentPerPa(
      data.payload,
      data.paPaymentData.referenceId,
      data.credentials,
    );

    const transactionRelationDetails = {
      programId: data.programId,
      paymentNr: data.paymentNr,
      userId: data.userId,
    };
    // Storing the per payment so you can continiously seed updates of transactions in Portal
    await this.transactionsService.storeTransactionUpdateStatus(
      paymentRequestResultPerPa,
      transactionRelationDetails,
    );
  }

  public async getPaRegistrationData(
    paPayment: PaPaymentDataDto,
    registrationData: CommercialBankEthiopiaRegistrationData[],
  ): Promise<CommercialBankEthiopiaRegistrationData[]> {
    const paRegistrationData = registrationData.filter(
      (item) => item.referenceId === paPayment.referenceId,
    );

    if (paPayment.transactionId) {
      const { customData } = await this.transactionRepository.findOneByOrFail({
        id: paPayment.transactionId,
      });
      // BEWARE: CommercialBankEthiopiaTransferPayload was used to silence the TS error
      // but in reality it might not be the actual type of requestResult
      const value = (
        customData.requestResult as CommercialBankEthiopiaTransferPayload
      ).debitTheIrRef;
      paRegistrationData.push({
        referenceId: paPayment.referenceId,
        fieldName: 'debitTheIrRef',
        value,
      });
    }

    return paRegistrationData;
  }

  public async getRegistrationData(
    referenceIds: string[],
  ): Promise<CommercialBankEthiopiaRegistrationData[]> {
    const registrationData = await this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        'registration.referenceId AS "referenceId"',
        'data.value AS value',
        'COALESCE("programQuestion".name, "fspQuestion".name) AS "fieldName"',
      ])
      .where('registration.referenceId IN (:...referenceIds)', {
        referenceIds,
      })
      .andWhere(
        '(programQuestion.name IN (:...names) OR fspQuestion.name IN (:...names))',
        {
          names: ['fullName', 'bankAccountNumber'],
        },
      )
      .leftJoin('registration.data', 'data')
      .leftJoin('data.programQuestion', 'programQuestion')
      .leftJoin('data.fspQuestion', 'fspQuestion')
      .getRawMany();

    // Filter out properties with null values from each object
    const nonEmptyRegistrationData = registrationData.map(
      (data: CommercialBankEthiopiaRegistrationData) => {
        for (const key in data) {
          if (
            Object.prototype.hasOwnProperty.call(data, key) &&
            data[key] === null
          ) {
            delete data[key];
          }
        }
        return data;
      },
    );

    return nonEmptyRegistrationData;
  }

  public createPayloadPerPa(
    payment: PaPaymentDataDto,
    paRegistrationData: CommercialBankEthiopiaRegistrationData[],
    program: ProgramEntity,
  ): CommercialBankEthiopiaTransferPayload {
    let fullName;
    let bankAccountNumber;
    let debitTheIrRefRetry;

    paRegistrationData.forEach((data) => {
      if (data.fieldName === 'fullName') {
        fullName = data.value;
      } else if (data.fieldName === 'bankAccountNumber') {
        bankAccountNumber = data.value;
      } else if ((data.fieldName = 'debitTheIrRef')) {
        debitTheIrRefRetry = data.value;
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

    return {
      debitAmount: payment.transactionAmount,
      debitTheIrRef:
        debitTheIrRefRetry ||
        `${formatDate(new Date())}${this.generateRandomNumerics(10)}`,
      creditTheIrRef: program.ngo,
      creditAcctNo: bankAccountNumber,
      creditCurrency: program.currency,
      remitterName:
        program.titlePortal && program.titlePortal.en
          ? program.titlePortal.en.substring(0, 35)
          : null,
      beneficiaryName: `${fullName}`,
    };
  }

  public async sendPaymentPerPa(
    payload: CommercialBankEthiopiaTransferPayload,
    referenceId: string,
    credentials: { username: string; password: string },
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName =
      FinancialServiceProviderName.commercialBankEthiopia;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.debitAmount;

    let result = await this.commercialBankEthiopiaApiService.creditTransfer(
      payload,
      credentials,
    );

    if (result && result.resultDescription === 'Transaction is DUPLICATED') {
      result = await this.commercialBankEthiopiaApiService.getTransactionStatus(
        payload,
        credentials,
      );
    }

    if (
      result &&
      result.Status &&
      result.Status.successIndicator &&
      result.Status.successIndicator._text === 'Success'
    ) {
      paTransactionResult.status = TransactionStatusEnum.success;
      payload.status = TransactionStatusEnum.success;
    } else {
      paTransactionResult.status = TransactionStatusEnum.error;
      paTransactionResult.message =
        result.resultDescription ||
        (result.Status &&
          result.Status.messages &&
          (result.Status.messages.length > 0
            ? result.Status.messages[0]._text
            : result.Status.messages._text));
    }

    paTransactionResult.customData = {
      requestResult: payload,
      paymentResult: result,
    };
    return paTransactionResult;
  }

  public async validateAllPas(): Promise<void> {
    const programs = await this.getAllProgramsWithCBE();
    for (const program of programs) {
      await this.validatePasForProgram(program.id);
    }
  }

  public async validatePasForProgram(programId: number): Promise<void> {
    const credentials: { username: string; password: string } =
      await this.getCommercialBankEthiopiaCredentials(programId);

    const getAllPersonsAffectedData =
      await this.getAllPersonsAffectedData(programId);

    console.time('getValidationStatus loop total');

    for (const pa of getAllPersonsAffectedData) {
      const logString = `getValidationStatus for PA: ${pa.id}`;
      console.time(logString);
      const paResult =
        await this.commercialBankEthiopiaApiService.getValidationStatus(
          pa.bankAccountNumber,
          credentials,
        );
      console.timeEnd(logString);

      const result = new CommercialBankEthiopiaAccountEnquiriesEntity();
      result.registrationId = pa?.id;
      result.fullNameUsedForTheMatch = pa?.fullName || null;
      result.bankAccountNumberUsedForCall = pa?.bankAccountNumber || null;
      result.cbeName = null;
      result.namesMatch = false;
      result.cbeStatus = null;
      result.errorMessage = null;

      if (paResult?.Status?.successIndicator?._text === 'Success') {
        const accountInfo =
          paResult?.EACCOUNTCBEREMITANCEType?.[
            'ns4:gEACCOUNTCBEREMITANCEDetailType'
          ]?.['ns4:mEACCOUNTCBEREMITANCEDetailType'];
        const cbeName = accountInfo?.['ns4:CUSTOMERNAME']?._text;
        const cbeStatus = accountInfo?.['ns4:ACCOUNTSTATUS']?._text;

        result.cbeName = cbeName || null;
        result.cbeStatus = cbeStatus || null;

        if (pa.fullName && cbeName) {
          result.namesMatch =
            pa.fullName.toUpperCase() === cbeName.toUpperCase();
        } else if (pa.fullName && !cbeName) {
          result.errorMessage =
            'Could not be matched: did not get a name from CBE for account number';
        } else if (cbeName && !pa.fullName) {
          result.errorMessage =
            'Could not be matched: fullName in 121 is missing';
        } else {
          result.errorMessage =
            'Could not be matched: fullName in 121 is missing and did not get a name from CBE for account number';
        }
      } else {
        result.errorMessage =
          paResult.resultDescription ||
          (paResult.Status &&
            paResult.Status.messages &&
            (paResult.Status.messages.length > 0
              ? paResult.Status.messages[0]._text
              : paResult.Status.messages._text));
      }
      const existingRecord =
        await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.findOne({
          where: { registrationId: Equal(pa.id) },
        });

      if (existingRecord) {
        await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.updateUnscoped(
          { registrationId: pa.id },
          result as QueryDeepPartialEntity<CommercialBankEthiopiaAccountEnquiriesEntity>,
        );
      } else {
        await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.save(
          result,
        );
      }
    }
    console.timeEnd('getValidationStatus loop total');
  }

  public async getAllPersonsAffectedData(
    programId: number,
  ): Promise<CommercialBankEthiopiaValidationData[]> {
    const registrationData = await this.registrationRepository
      .createQueryBuilder('registration')
      .select([
        'registration.id AS "id"',
        'ARRAY_AGG(data.value) AS "values"',
        'ARRAY_AGG(COALESCE("programQuestion".name, "fspQuestion".name)) AS "fieldNames"',
      ])
      .where('registration.programId = :programId', { programId })
      .andWhere(
        '(programQuestion.name IN (:...names) OR fspQuestion.name IN (:...names))',
        {
          names: ['fullName', 'bankAccountNumber'],
        },
      )
      .andWhere('registration.registrationStatus NOT IN (:...statusValues)', {
        statusValues: ['deleted', 'paused'],
      })
      .leftJoin('registration.data', 'data')
      .leftJoin('data.programQuestion', 'programQuestion')
      .leftJoin('data.fspQuestion', 'fspQuestion')
      .groupBy('registration.id')
      .getRawMany();

    // Create a new array by mapping the original objects
    const formattedData: any = registrationData.map((pa) => {
      const paData = { id: pa.id };
      pa.fieldNames.forEach((fieldName: string, index: number) => {
        paData[fieldName] = pa.values[index];
      });
      return paData;
    });

    return formattedData;
  }

  public async getCommercialBankEthiopiaCredentials(
    programId: number,
  ): Promise<{ username: string; password: string }> {
    const config = await this.programFspConfigurationRepository
      .createQueryBuilder('fspConfig')
      .select('name')
      .addSelect('value')
      .where('fspConfig.programId = :programId', { programId })
      .andWhere('fsp.fsp = :fspName', {
        fspName: FinancialServiceProviderName.commercialBankEthiopia,
      })
      .leftJoin('fspConfig.fsp', 'fsp')
      .getRawMany();

    const credentials: { username: string; password: string } = {
      username: config.find(
        (c) => c.name === FinancialServiceProviderConfigurationEnum.username,
      )?.value,
      password: config.find(
        (c) => c.name === FinancialServiceProviderConfigurationEnum.password,
      )?.value,
    };

    return credentials;
  }

  public async getAllProgramsWithCBE(): Promise<ProgramEntity[]> {
    const programs = await this.programRepository
      .createQueryBuilder('program')
      .select('program.id')
      .innerJoin(
        'program.financialServiceProviders',
        'financialServiceProviders',
      )
      .where('financialServiceProviders.fsp = :fsp', {
        fsp: FinancialServiceProviderName.commercialBankEthiopia,
      })
      .getMany();

    return programs;
  }

  public async getAllPaValidations(
    programId: number,
  ): Promise<CommercialBankEthiopiaValidationReportDto> {
    const programPAs =
      await this.commercialBankEthiopiaAccountEnquiriesScopedRepo
        .createQueryBuilder('cbe')
        .innerJoin('cbe.registration', 'registration')
        .andWhere('registration.programId = :programId', {
          programId,
        })
        .andWhere('registration.registrationStatus NOT IN (:...statusValues)', {
          statusValues: ['deleted', 'paused'],
        })
        .select([
          `registration."referenceId" as "referenceId"`,
          'registration.registrationProgramId as "registrationProgramId"',
          'cbe.fullNameUsedForTheMatch as "fullNameUsedForTheMatch"',
          'cbe.cbeName as "cbeName"',
          'cbe.bankAccountNumberUsedForCall as "bankAccountNumberUsedForCall"',
          'cbe.errorMessage as "errorMessage"',
          'cbe.cbeStatus as "cbeStatus"',
          'cbe.updated as "updated"',
        ])
        .getRawMany();

    return { data: programPAs, fileName: 'cbe-validation-report' };
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
