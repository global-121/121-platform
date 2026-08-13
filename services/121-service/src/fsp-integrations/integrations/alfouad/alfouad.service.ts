import { Injectable } from '@nestjs/common';

import { AlfouadCreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transfer-params.interface';
import { AlfouadCreateTransferResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transfer-result.interface';
import { AlfouadGetTransactionResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-get-transaction-result.interface';
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
    params: AlfouadCreateTransferParams,
  ): Promise<AlfouadCreateTransferResult> {
    return this.alfouadApiService.createTransfer(params);
  }

  public async getTransactionByRef({
    referenceNumber,
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<AlfouadGetTransactionResult | undefined> {
    return this.alfouadApiService.getTransactionByRef({
      referenceNumber,
      requestIdentity,
    });
  }
}
