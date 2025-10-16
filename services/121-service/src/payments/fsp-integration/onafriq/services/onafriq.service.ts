import { Injectable } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { OnafriqApiWebhookSubscribeResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-webhook-subscribe-response-body.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { CreateTransactionParams } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';
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
    transferAmount,
    phoneNumberPayment,
    firstName,
    lastName,
    thirdPartyTransId,
    credentials,
  }: CreateTransactionParams): Promise<void> {
    // Simulate timeout, use this to test unintended Redis job re-attempt, by restarting 121-service during this timeout
    // 1. Simulate crash before API-call
    // await new Promise((resolve) => setTimeout(resolve, 60000));

    const mappedResponse = await this.onafriqApiService.callService({
      transferAmount,
      phoneNumberPayment,
      firstName,
      lastName,
      thirdPartyTransId,
      credentials,
    });

    if (mappedResponse.status !== OnafriqApiResponseStatusType.success) {
      const errorMessage = mappedResponse.errorMessage;
      throw new OnafriqError(errorMessage!, mappedResponse.status);
    }

    // 2. Simulate crash after API call
    // await new Promise((resolve) => setTimeout(resolve, 60000));
  }
}
