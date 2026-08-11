import { Injectable } from '@nestjs/common';

import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-params.interface';
import { CreateTransferResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-result.interface';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
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
    };
  }

  public async createTransfer(
    params: CreateTransferParams,
  ): Promise<CreateTransferResult> {
    return this.alfouadApiService.createTransfer(params);
  }

  public mapAlfouadStateToTransactionStatus({
    alfouadState,
  }: {
    alfouadState: AlfouadApiTransactionStateEnum;
  }): TransactionStatusEnum {
    switch (alfouadState) {
      case AlfouadApiTransactionStateEnum.paid:
        return TransactionStatusEnum.success;
      case AlfouadApiTransactionStateEnum.pendingApproval:
      case AlfouadApiTransactionStateEnum.approved:
      case AlfouadApiTransactionStateEnum.hold:
        return TransactionStatusEnum.waiting;
      case AlfouadApiTransactionStateEnum.canceled:
        return TransactionStatusEnum.error;
      default:
        return TransactionStatusEnum.error;
    }
  }
}
