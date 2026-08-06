import { Injectable } from '@nestjs/common';

import { AlfouadTransferStatus } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-transfer-status.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class AlfouadApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async createTransfer({
    alfouadReferenceId,
    amount,
    currency,
    externalId,
    phoneNumber,
  }: {
    alfouadReferenceId: string;
    amount: string;
    currency: string;
    externalId: string;
    phoneNumber: string;
  }): Promise<void> {
    const payload = {
      alfouadReferenceId,
      amount,
      currency,
      externalId,
      phoneNumber,
    };
    // TODO: Send `payload` to the Al Fouad transfer API using `this.httpService`.
    throw new Error(
      `Alfouad createTransfer is not implemented yet: ${JSON.stringify(payload)}`,
    );
  }

  public async getTransfer({
    alfouadReferenceId,
  }: {
    alfouadReferenceId: string;
  }): Promise<AlfouadTransferStatus> {
    // TODO: Query the Al Fouad transfer-status API using `this.httpService`.
    throw new Error(
      `Alfouad getTransfer is not implemented yet: ${alfouadReferenceId}`,
    );
  }
}
