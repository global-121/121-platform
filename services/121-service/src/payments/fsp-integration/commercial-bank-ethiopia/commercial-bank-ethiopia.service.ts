import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { ProgramFspConfigurationEntity } from '../../../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { ScopedRepository } from '../../../scoped.repository';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { getScopedRepositoryProviderName } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import {
  FspTransactionResultDto,
  PaTransactionResultDto,
} from '../../dto/payment-transaction-result.dto';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from './commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaApiService } from './commercial-bank-ethiopia.api.service';
import {
  CommercialBankEthiopiaRegistrationData,
  CommercialBankEthiopiaTransferPayload,
  CommercialBankEthiopiaValidationData,
} from './dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaValidationReportDto } from './dto/commercial-bank-ethiopia-validation-report.dto';

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
    private readonly commercialBankEthiopiaApiService: CommercialBankEthiopiaApiService,
    private readonly transactionsService: TransactionsService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    paymentNr: number,
  ): Promise<FspTransactionResultDto> {
    const credentials: { username: string; password: string } =
      await this.getCommercialBankEthiopiaCredentials(programId);

    const program = await this.programRepository.findOneBy({
      id: programId,
    });

    const fspTransactionResult = new FspTransactionResultDto();
    fspTransactionResult.paList = [];
    fspTransactionResult.fspName = FspName.commercialBankEthiopia;

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

      const paymentRequestResultPerPa = await this.sendPaymentPerPa(
        payload,
        paPayment.referenceId,
        credentials,
      );
      fspTransactionResult.paList.push(paymentRequestResultPerPa);
      // Storing the per payment so you can continiously seed updates of transactions in Portal
      await this.transactionsService.storeTransactionUpdateStatus(
        paymentRequestResultPerPa,
        programId,
        paymentNr,
      );
    }
    return fspTransactionResult;
  }

  public async getPaRegistrationData(
    paPayment: PaPaymentDataDto,
    registrationData: CommercialBankEthiopiaRegistrationData[],
  ): Promise<CommercialBankEthiopiaRegistrationData[]> {
    const paRegistrationData = registrationData.filter(
      (item) => item.referenceId === paPayment.referenceId,
    );

    if (paPayment.transactionId) {
      const transaction = await this.transactionRepository.findOneBy({
        id: paPayment.transactionId,
      });
      const customData = {
        ...transaction.customData,
      };
      paRegistrationData.push({
        referenceId: paPayment.referenceId,
        fieldName: 'debitTheIrRef',
        value: customData['requestResult'].debitTheIrRef,
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
        referenceIds: referenceIds,
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

    const payload = {
      debitAmount: payment.transactionAmount,
      debitTheIrRef:
        debitTheIrRefRetry ||
        `${formatDate(new Date())}${this.generateRandomNumerics(10)}`,
      creditTheIrRef: program.ngo,
      creditAcctNo: bankAccountNumber,
      creditCurrency: program.currency,
      remitterName: program.titlePaApp['en'].substring(0, 35),
      beneficiaryName: `${fullName}`,
    };

    return payload;
  }

  public async sendPaymentPerPa(
    payload: CommercialBankEthiopiaTransferPayload,
    referenceId: string,
    credentials: { username: string; password: string },
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
      paTransactionResult.status = StatusEnum.success;
      payload.status = StatusEnum.success;
    } else {
      paTransactionResult.status = StatusEnum.error;
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
          console.log('### No pa.cbeName', JSON.stringify(paResult));
          result.errorMessage =
            'Could not be matched: did not get a name from CBE for account number';
        } else if (cbeName && !pa.fullName) {
          result.errorMessage =
            'Could not be matched: fullName in 121 is missing';
        } else {
          console.log('### No pa.cbeName & fullName', JSON.stringify(paResult));
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
          where: { registrationId: pa.id },
        });

      if (existingRecord) {
        await this.commercialBankEthiopiaAccountEnquiriesScopedRepo.updateUnscoped(
          { registrationId: pa.id },
          result,
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
        statusValues: [
          'deleted',
          'inclusionEnded',
          'reject',
          'noLongerEligible',
          'registeredWhileNoLongerEligible',
          'paused',
        ],
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
        fspName: FspName.commercialBankEthiopia,
      })
      .leftJoin('fspConfig.fsp', 'fsp')
      .getRawMany();

    const credentials: { username: string; password: string } = {
      username: config.find((c) => c.name === 'username')?.value,
      password: config.find((c) => c.name === 'password')?.value,
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
        fsp: FspName.commercialBankEthiopia,
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
          programId: programId,
        })
        .andWhere('registration.registrationStatus NOT IN (:...statusValues)', {
          statusValues: [
            'deleted',
            'inclusionEnded',
            'reject',
            'noLongerEligible',
            'registeredWhileNoLongerEligible',
            'paused',
          ],
        })
        .select([
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
