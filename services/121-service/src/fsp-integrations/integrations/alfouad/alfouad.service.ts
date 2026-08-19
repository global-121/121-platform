import { Injectable } from '@nestjs/common';

import { AlfouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-error-code.enum';
import { AlfouadApiResponseStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-response-state.enum';
import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class AlfouadService {
  public constructor(
    private readonly alfouadApiService: AlfouadApiService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async getAlfouadFspConfig({
    programFspConfigurationId,
  }: {
    programFspConfigurationId: number;
  }): Promise<AlfouadRequestIdentity> {
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
      account: valueOf(FspConfigurationProperties.accountAlfouad),
      branchId: valueOf(FspConfigurationProperties.branchIdAlfouad),
      username: valueOf(FspConfigurationProperties.usernameAlfouad),
      password: valueOf(FspConfigurationProperties.passwordAlfouad),
      publicKey: valueOf(FspConfigurationProperties.publicKeyAlfouad),
      senderFullName: valueOf(FspConfigurationProperties.senderFullNameAlfouad),
      senderPhoneNumber: valueOf(FspConfigurationProperties.senderPhoneNumberAlfouad),
    };
  }

  public async createTransaction(
    params: AlfouadCreateTransactionParams,
  ): Promise<void> {
    const response = await this.alfouadApiService.createTransaction(params);

    const { State, ErrorCode, Message } = response;

    if (State === AlfouadApiResponseStateEnum.success) {
      return;
    }

    if (ErrorCode === AlfouadApiErrorCode.duplicateReferenceNumber) {
      const { referenceNumber, requestIdentity } = params;

      await this.confirmDuplicateTransactionExists({ referenceNumber, requestIdentity });
      return;
    }

    throw new AlfouadApiError({
      message: Message ?? JSON.stringify(response),
      errorCode: ErrorCode,
    });
  }

  private async confirmDuplicateTransactionExists({
    referenceNumber,
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<void> {
    const transactionState =
      await this.alfouadApiService.getTransactionStateByRef({
        referenceNumber,
        requestIdentity,
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
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<AlfouadApiTransactionStateEnum | undefined> {
    return this.alfouadApiService.getTransactionStateByRef({
      referenceNumber,
      requestIdentity,
    });
  }
}
