import { Inject, Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CreditTransferApiParams } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-transfer-payload.dto';
import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';
import { CreateCreditTransferOrGetTransactionStatusParams } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/interfaces/create-credit-transfer-or-get-transaction-status-params.interface';
import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RequiredUsernamePasswordInterface } from '@121-service/src/program-fsp-configurations/interfaces/required-username-password.interface';
import { UsernamePasswordInterface } from '@121-service/src/program-fsp-configurations/interfaces/username-password.interface';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class CommercialBankEthiopiaService {
  @Inject(
    getScopedRepositoryProviderName(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
  )
  private readonly commercialBankEthiopiaAccountEnquiriesScopedRepo: ScopedRepository<CommercialBankEthiopiaAccountEnquiriesEntity>;

  public constructor(
    private readonly commercialBankEthiopiaApiService: CommercialBankEthiopiaApiService,
    public readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async createCreditTransferOrGetTransactionStatus({
    inputParams,
    credentials,
  }: {
    inputParams: CreateCreditTransferOrGetTransactionStatusParams;
    credentials: UsernamePasswordInterface;
  }): Promise<any> {
    const mappedParams = this.mapCreditTransferParams(inputParams);

    let result = await this.commercialBankEthiopiaApiService.creditTransfer(
      mappedParams,
      credentials,
    );

    if (result && result.resultDescription === 'Transaction is DUPLICATED') {
      result = await this.commercialBankEthiopiaApiService.getTransactionStatus(
        mappedParams,
        credentials,
      );
    }

    let status: TransactionStatusEnum;
    let errorMessage: string | undefined;

    if (
      result &&
      result.Status &&
      result.Status.successIndicator &&
      result.Status.successIndicator._text === 'Success'
    ) {
      status = TransactionStatusEnum.success;
    } else {
      status = TransactionStatusEnum.error;
      errorMessage =
        result.resultDescription ||
        (result.Status &&
          result.Status.messages &&
          (result.Status.messages.length > 0
            ? result.Status.messages[0]._text
            : result.Status.messages._text));
    }

    return { status, errorMessage };
  }

  private mapCreditTransferParams({
    debitTheirRef,
    bankAccountNumber,
    currency,
    ngoName,
    titlePortal,
    fullName,
    amount,
  }: CreateCreditTransferOrGetTransactionStatusParams): CreditTransferApiParams {
    return {
      debitAmount: amount,
      debitTheirRef,
      creditTheirRef:
        titlePortal && titlePortal.en
          ? titlePortal.en.replaceAll(/\W/g, '').substring(0, 16)
          : null,
      creditAcctNo: bankAccountNumber,
      creditCurrency: currency,
      remitterName: ngoName ? ngoName.substring(0, 35) : null,
      beneficiaryName: fullName.substring(0, 35),
    };
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
        { programFspConfigurationId: configs[0].id },
      );

    if (credentials.password == null || credentials.username == null) {
      throw new HttpException(
        `Missing username or password for program ${programId} Fsp configuration.`,
        HttpStatus.NOT_FOUND,
      );
    }

    // added this to prevent a TypeError as: return credentials gives a type error
    const requiredCredentials: RequiredUsernamePasswordInterface = {
      username: credentials.username,
      password: credentials.password,
    };

    return requiredCredentials;
  }

  public async getAccountVerificationReport(
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
}
