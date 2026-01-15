import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { OnafriqApiWebhookSubscribeResponseBody } from '@121-service/src/fsp-integrations/integrations/onafriq/dtos/onafriq-api/onafriq-api-webhook-subscribe-response-body.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/fsp-integrations/integrations/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/fsp-integrations/integrations/onafriq/errors/onafriq.error';
import { CreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqApiService } from '@121-service/src/fsp-integrations/integrations/onafriq/services/onafriq.api.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

@Injectable()
export class OnafriqService {
  public constructor(
    private readonly onafriqApiService: OnafriqApiService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async subscribeWebhook(
    programId: number,
  ): Promise<OnafriqApiWebhookSubscribeResponseBody | undefined> {
    const fspConfigs =
      await this.programFspConfigurationRepository.getByProgramIdAndFspName({
        programId,
        fspName: Fsps.onafriq,
      });
    if (fspConfigs.length === 0) {
      throw new HttpException(
        `No Onafriq program fsp config properties found for program with id ${programId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const programFspConfigProperties =
      await this.programFspConfigurationRepository.getPropertiesByNamesOrThrow({
        programFspConfigurationId: fspConfigs[0].id, // There will be just 1 fspConfig per program for Onafriq
        names: [
          FspConfigurationProperties.corporateCodeOnafriq,
          FspConfigurationProperties.passwordOnafriq,
        ],
      });
    const corporateCode = programFspConfigProperties.find(
      (c) => c.name === FspConfigurationProperties.corporateCodeOnafriq,
    )?.value as string;
    const password = programFspConfigProperties.find(
      (c) => c.name === FspConfigurationProperties.passwordOnafriq,
    )?.value as string;

    return await this.onafriqApiService.subscribeWebhook(
      corporateCode,
      password,
    );
  }

  public async createTransaction({
    transferValue,
    phoneNumberPayment,
    firstName,
    lastName,
    thirdPartyTransId,
    requestIdentity,
  }: CreateTransactionParams): Promise<void> {
    // Simulate timeout, use this to test unintended Redis job re-attempt, by restarting 121-service during this timeout
    // 1. Simulate crash before API-call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    const mappedResponse = await this.onafriqApiService.callService({
      transferValue,
      phoneNumberPayment,
      firstName,
      lastName,
      thirdPartyTransId,
      requestIdentity,
    });

    if (mappedResponse.status !== OnafriqApiResponseStatusType.success) {
      const errorMessage = mappedResponse.errorMessage;
      throw new OnafriqError(errorMessage!, mappedResponse.status);
    }

    // 2. Simulate crash after API call
    // await new Promise((resolve) => setTimeout(resolve, 60000));
  }
}
