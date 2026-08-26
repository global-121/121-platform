import { Injectable } from '@nestjs/common';

import { AlfouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-error-code.enum';
import { AlfouadApiResponseState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-response-state.enum';
import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-auth-identity.class';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadSenderInfo } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-sender-info.interface';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { computeTransactionReference } from '@121-service/src/fsp-integrations/shared/helpers/generate-transaction-reference.helper';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class AlfouadService {
  public constructor(
    private readonly alfouadApiService: AlfouadApiService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async getAlfouadFspConfig({
    programFspConfigurationId,
  }: {
    programFspConfigurationId: number;
  }): Promise<{
    authIdentity: AlfouadAuthIdentity;
    senderInfo: AlfouadSenderInfo;
  }> {
    const properties =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId,
        names: [
          FspConfigurationProperties.accountAlfouad,
          FspConfigurationProperties.branchIdAlfouad,
          FspConfigurationProperties.usernameAlfouad,
          FspConfigurationProperties.passwordAlfouad,
          FspConfigurationProperties.publicKeyAlfouad,
          FspConfigurationProperties.senderFullNameAlfouad,
          FspConfigurationProperties.senderPhoneNumberAlfouad,
        ],
      });

    const valueOf = (name: FspConfigurationProperties): string =>
      properties.find((property) => property.name === name)?.value as string;

    return {
      authIdentity: new AlfouadAuthIdentity({
        account: valueOf(FspConfigurationProperties.accountAlfouad),
        branchId: valueOf(FspConfigurationProperties.branchIdAlfouad),
        username: valueOf(FspConfigurationProperties.usernameAlfouad),
        password: valueOf(FspConfigurationProperties.passwordAlfouad),
        publicKey: valueOf(FspConfigurationProperties.publicKeyAlfouad),
      }),
      senderInfo: {
        senderFullName: valueOf(
          FspConfigurationProperties.senderFullNameAlfouad,
        ),
        senderPhoneNumber: valueOf(
          FspConfigurationProperties.senderPhoneNumberAlfouad,
        ),
      },
    };
  }

  public async createTransaction(
    params: AlfouadCreateTransactionParams,
  ): Promise<void> {
    const result = await this.alfouadApiService.createTransaction(params);

    const { state, errorCode, message } = result;

    if (state === AlfouadApiResponseState.success) {
      return;
    }

    if (errorCode === AlfouadApiErrorCode.duplicateReferenceNumber) {
      const { referenceNumber, authIdentity } = params;

      await this.confirmDuplicateTransactionExists({
        referenceNumber,
        authIdentity,
      });
      return;
    }

    throw new AlfouadApiError({
      message: message ?? JSON.stringify(result),
      errorCode,
    });
  }

  private async confirmDuplicateTransactionExists({
    referenceNumber,
    authIdentity,
  }: {
    referenceNumber: string;
    authIdentity: AlfouadAuthIdentity;
  }): Promise<void> {
    const transactionState =
      await this.alfouadApiService.getTransactionStateByRef({
        referenceNumber,
        authIdentity,
      });

    if (!transactionState) {
      throw new AlfouadApiError({
        message: `Duplicate ReferenceNumber ${referenceNumber} was reported but the transaction was not found`,
        errorCode: AlfouadApiErrorCode.duplicateReferenceNumber,
      });
    }
  }

  public async getTransactionStateByRef({
    referenceNumber,
    authIdentity,
  }: {
    referenceNumber: string;
    authIdentity: AlfouadAuthIdentity;
  }): Promise<AlfouadApiTransactionState | undefined> {
    return this.alfouadApiService.getTransactionStateByRef({
      referenceNumber,
      authIdentity,
    });
  }

  public async generateReferenceNumber({
    referenceId,
    transactionId,
  }: {
    referenceId: string;
    transactionId: number;
  }): Promise<string> {
    const failedTransactionAttempts =
      await this.transactionEventScopedRepository.countFailedTransactionAttempts(
        transactionId,
      );

    return computeTransactionReference({
      referenceId,
      transactionId,
      failedTransactionAttempts,
    });
  }

  public mapAlfouadStateToTransactionStatus({
    alfouadState,
  }: {
    alfouadState: AlfouadApiTransactionState;
  }): TransactionStatusEnum {
    switch (alfouadState) {
      case AlfouadApiTransactionState.paid:
        return TransactionStatusEnum.success;
      case AlfouadApiTransactionState.pendingApproval:
      case AlfouadApiTransactionState.approved:
      case AlfouadApiTransactionState.hold:
        return TransactionStatusEnum.waiting;
      case AlfouadApiTransactionState.canceled:
        return TransactionStatusEnum.error;
      default:
        return TransactionStatusEnum.error;
    }
  }
}
