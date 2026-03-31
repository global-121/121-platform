import { Injectable } from '@nestjs/common';

import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/create-transfer-params.interface';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';

@Injectable()
export class MtnService {
  public constructor(private readonly mtnApiService: MtnApiService) {}

  public async createTransfer({
    amount,
    currency,
    externalId,
    payee,
    payerMessage,
    payeeNote,
  }: CreateTransferParams): Promise<void> {
    await this.mtnApiService.createTransfer({
      amount,
      currency,
      externalId,
      payee,
      payerMessage,
      payeeNote,
    });
  }
}
