import { Inject, Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaJobDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-job.dto';
import {
  CommercialBankEthiopiaRegistrationData,
  CommercialBankEthiopiaTransferPayload,
} from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';
import { CommercialBankEthiopiaApiService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { RequiredUsernamePasswordInterface } from '@121-service/src/program-fsp-configurations/interfaces/required-username-password.interface';
import { UsernamePasswordInterface } from '@121-service/src/program-fsp-configurations/interfaces/username-password.interface';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { formatDateYYMMDD } from '@121-service/src/utils/formatDate';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class CommercialBankEthiopiaService implements FspIntegrationInterface {
  @InjectRepository(RegistrationEntity)
  public registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;
  @Inject(
    getScopedRepositoryProviderName(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
  )
  private readonly commercialBankEthiopiaAccountEnquiriesScopedRepo: ScopedRepository<CommercialBankEthiopiaAccountEnquiriesEntity>;

  public constructor(
    private readonly queuesService: QueuesRegistryService,
    private readonly commercialBankEthiopiaApiService: CommercialBankEthiopiaApiService,
    private readonly transactionsService: TransactionsService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    public readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    paymentId: number,
  ): Promise<FspTransactionResultDto> {
    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });

    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = Fsps.commercialBankEthiopia;

    const referenceIds = paPaymentList.map(
      (paPayment) => paPayment.referenceId,
    );
    const registrationData = await this.getRegistrationData(referenceIds);

    // TODO Refactor this to get all data in one query instead of per PA
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
        paymentId,
        programId,
        payload,
        userId: paPayment.userId,
      };
      const job =
        await this.queuesService.transactionJobCommercialBankEthiopiaQueue.add(
          JobNames.default,
          jobData,
        );
      await this.redisClient.sadd(getRedisSetName(job.data.programId), job.id);
    }
    return fspTransactionResult;
  }

  async processQueuedPayment(
    data: CommercialBankEthiopiaJobDto,
  ): Promise<void> {
    const credentials =
      await this.programFspConfigurationRepository.getUsernamePasswordProperties(
        data.paPaymentData.programFspConfigurationId,
      );

    const paymentRequestResultPerPa = await this.sendPaymentPerPa(
      data.payload,
      data.paPaymentData.referenceId,
      credentials,
    );

    const transactionRelationDetails = {
      programId: data.programId,
      paymentId: data.paymentId,
      userId: data.userId,
      programFspConfigurationId: data.paPaymentData.programFspConfigurationId,
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
      ).debitTheirRef;
      paRegistrationData.push({
        referenceId: paPayment.referenceId,
        fieldName: 'debitTheirRef',
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
        '"programRegistrationAttribute".name AS "fieldName"',
      ])
      .where('registration.referenceId IN (:...referenceIds)', {
        referenceIds,
      })
      .andWhere('(programRegistrationAttribute.name IN (:...names))', {
        names: [FspAttributes.fullName, FspAttributes.bankAccountNumber],
      })
      .leftJoin('registration.data', 'data')
      .leftJoin(
        'data.programRegistrationAttribute',
        'programRegistrationAttribute',
      )
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
    let fullName = '';
    let bankAccountNumber;
    let debitTheirRefRetry;

    paRegistrationData.forEach((data) => {
      if (data.fieldName === FspAttributes.fullName) {
        fullName = data.value;
      } else if (data.fieldName === FspAttributes.bankAccountNumber) {
        bankAccountNumber = data.value;
      } else if ((data.fieldName = 'debitTheirRef')) {
        // This is a test code which is used in mock mode to simulate a transfer credit that is duplicated
        // The mock service checks if the debitTheirRef starts with 'duplicate-' and if so, will simulate a duplicate transfer flow
        debitTheirRefRetry = data.value;
      }
    });

    return {
      debitAmount: payment.transactionAmount,
      debitTheirRef: (
        debitTheirRefRetry ||
        `${formatDateYYMMDD(new Date())}${this.generateRandomNumerics(10)}`
      ).substring(0, 16),
      creditTheirRef:
        program.titlePortal && program.titlePortal.en
          ? program.titlePortal.en.replaceAll(/\W/g, '').substring(0, 16)
          : null,
      creditAcctNo: bankAccountNumber,
      creditCurrency: program.currency,
      remitterName: program.ngo ? program.ngo.substring(0, 35) : null,
      beneficiaryName: fullName.substring(0, 35),
    };
  }

  public async sendPaymentPerPa(
    payload: CommercialBankEthiopiaTransferPayload,
    referenceId: string,
    credentials: UsernamePasswordInterface,
  ): Promise<PaTransactionResultDto> {
    const paTransactionResult = new PaTransactionResultDto();
    paTransactionResult.fspName = Fsps.commercialBankEthiopia;
    paTransactionResult.referenceId = referenceId;
    paTransactionResult.date = new Date();
    paTransactionResult.calculatedAmount = payload.debitAmount;

    let requiredCredentials: RequiredUsernamePasswordInterface;
    if (credentials.password == null || credentials.username == null) {
      paTransactionResult.status = TransactionStatusEnum.error;
      paTransactionResult.message =
        'Missing username or password for program Fsp configuration of the registration';
      return paTransactionResult;
    } else {
      requiredCredentials = {
        username: credentials.username,
        password: credentials.password,
      };

      let result = await this.commercialBankEthiopiaApiService.creditTransfer(
        payload,
        requiredCredentials,
      );

      if (result && result.resultDescription === 'Transaction is DUPLICATED') {
        result =
          await this.commercialBankEthiopiaApiService.getTransactionStatus(
            payload,
            requiredCredentials,
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
  }

  public async getCommercialBankEthiopiaCredentialsOrThrow({
    programId,
  }: {
    programId: number;
  }): Promise<RequiredUsernamePasswordInterface> {
    const configs =
      await this.programFspConfigurationRepository.getByProgramIdAndFspName({
        programId,
        fspName: Fsps.commercialBankEthiopia,
      });

    // For now we only support one CBE FSP configuration per program
    if (configs.length !== 1) {
      throw new HttpException(
        `Expected exactly one program Fsp configuration for program ${programId} and Fsp ${Fsps.commercialBankEthiopia}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const credentials =
      await this.programFspConfigurationRepository.getUsernamePasswordProperties(
        configs[0].id,
      );

    if (credentials.password == null || credentials.username == null) {
      throw new HttpException(
        'Missing username or password for program Fsp configuration of the registration',
        HttpStatus.NOT_FOUND,
      );
    }

    // added this to prevent a typeerror as: return credentials gives a type error
    const requiredCredentials: RequiredUsernamePasswordInterface = {
      username: credentials.username,
      password: credentials.password,
    };

    return requiredCredentials;
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
