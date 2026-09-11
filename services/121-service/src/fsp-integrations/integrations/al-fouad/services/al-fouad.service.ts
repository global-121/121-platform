import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { AlFouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-error-code.enum';
import { AlFouadApiResponseState } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-response-state.enum';
import { AlFouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-transaction-state.enum';
import { AlFouadMockReferenceId } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-mock-reference-id.enum';
import { AlFouadApiError } from '@121-service/src/fsp-integrations/integrations/al-fouad/errors/al-fouad-api.error';
import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-create-transaction-params.interface';
import { AlFouadSenderInfo } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-sender-info.interface';
import { AlFouadApiService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.api.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { computeTransactionReference } from '@121-service/src/fsp-integrations/shared/helpers/generate-transaction-reference.helper';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class AlFouadService {
  public constructor(
    private readonly alFouadApiService: AlFouadApiService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionEventScopedRepository: TransactionEventsScopedRepository,
  ) {}

  public async getAlFouadFspConfig({
    programFspConfigurationId,
  }: {
    programFspConfigurationId: number;
  }): Promise<{
    authIdentity: AlFouadAuthIdentity;
    senderInfo: AlFouadSenderInfo;
  }> {
    const properties =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId,
        names: [
          FspConfigurationProperties.accountAlFouad,
          FspConfigurationProperties.branchIdAlFouad,
          FspConfigurationProperties.usernameAlFouad,
          FspConfigurationProperties.passwordAlFouad,
          FspConfigurationProperties.publicKeyAlFouad,
          FspConfigurationProperties.senderFullNameAlFouad,
          FspConfigurationProperties.senderPhoneNumberAlFouad,
        ],
      });

    const valueOf = (name: FspConfigurationProperties): string =>
      properties.find((property) => property.name === name)?.value as string;

    return {
      authIdentity: {
        account: valueOf(FspConfigurationProperties.accountAlFouad),
        branchId: valueOf(FspConfigurationProperties.branchIdAlFouad),
        username: valueOf(FspConfigurationProperties.usernameAlFouad),
        password: valueOf(FspConfigurationProperties.passwordAlFouad),
        publicKey: valueOf(FspConfigurationProperties.publicKeyAlFouad),
      },
      senderInfo: {
        senderFullName: valueOf(
          FspConfigurationProperties.senderFullNameAlFouad,
        ),
        senderPhoneNumber: valueOf(
          FspConfigurationProperties.senderPhoneNumberAlFouad,
        ),
      },
    };
  }

  public async createTransaction(
    params: AlFouadCreateTransactionParams,
  ): Promise<void> {
    const result = await this.alFouadApiService.createTransaction(params);

    const { state, errorCode, message } = result;

    if (state === AlFouadApiResponseState.success) {
      return;
    }

    if (errorCode === AlFouadApiErrorCode.duplicateReferenceNumber) {
      const { referenceNumber, authIdentity } = params;

      await this.confirmDuplicateTransactionExists({
        referenceNumber,
        authIdentity,
      });
      return;
    }

    throw new AlFouadApiError({
      message: message ?? JSON.stringify(result),
      errorCode,
    });
  }

  private async confirmDuplicateTransactionExists({
    referenceNumber,
    authIdentity,
  }: {
    referenceNumber: string;
    authIdentity: AlFouadAuthIdentity;
  }): Promise<void> {
    const transactionState =
      await this.alFouadApiService.getTransactionStateByRef({
        referenceNumber,
        authIdentity,
      });

    if (!transactionState) {
      throw new AlFouadApiError({
        message: `Duplicate ReferenceNumber ${referenceNumber} was reported but the transaction was not found`,
        errorCode: AlFouadApiErrorCode.duplicateReferenceNumber,
      });
    }
  }

  public async getTransactionStateByRef({
    referenceNumber,
    authIdentity,
  }: {
    referenceNumber: string;
    authIdentity: AlFouadAuthIdentity;
  }): Promise<AlFouadApiTransactionState | undefined> {
    return this.alFouadApiService.getTransactionStateByRef({
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
    if (this.shouldPassMockReferenceIdThrough(referenceId)) {
      return referenceId;
    }

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

  private shouldPassMockReferenceIdThrough(referenceId: string): boolean {
    if (env.AL_FOUAD_MODE !== FspMode.mock) {
      return false;
    }

    const mockReferenceIds = Object.values(AlFouadMockReferenceId) as string[];
    return mockReferenceIds.includes(referenceId);
  }

  public mapAlFouadStateToTransactionStatus({
    alFouadState,
  }: {
    alFouadState: AlFouadApiTransactionState;
  }): TransactionStatusEnum {
    switch (alFouadState) {
      case AlFouadApiTransactionState.paid:
        return TransactionStatusEnum.success;
      case AlFouadApiTransactionState.pendingApproval:
      case AlFouadApiTransactionState.approved:
      case AlFouadApiTransactionState.hold:
        return TransactionStatusEnum.waiting;
      case AlFouadApiTransactionState.canceled:
        return TransactionStatusEnum.error;
      default:
        return TransactionStatusEnum.error;
    }
  }

  public mapAlFouadStateToFinalTransactionStatus({
    alFouadState,
  }: {
    alFouadState: AlFouadApiTransactionState;
  }): { newTransactionStatus: TransactionStatusEnum; errorMessage?: string } | undefined {
    const newTransactionStatus = this.mapAlFouadStateToTransactionStatus({
      alFouadState,
    });

    // Pending / Approved / Hold: leave the transaction on 'waiting'.
    if (newTransactionStatus === TransactionStatusEnum.waiting) {
      return;
    }

    return {
      newTransactionStatus,
      errorMessage:
        newTransactionStatus === TransactionStatusEnum.error
          ? 'The transaction was canceled at Al Fouad.'
          : undefined,
    };
  }
}
