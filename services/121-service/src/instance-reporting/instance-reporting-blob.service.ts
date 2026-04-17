import { ContainerClient } from '@azure/storage-blob';
import { Inject, Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { PushInstanceReportingDataResponseDto } from '@121-service/src/instance-reporting/dtos/push-instance-reporting-data-response.dto';

@Injectable()
export class InstanceReportingBlobService {
  constructor(
    @Inject(ContainerClient)
    private readonly containerClient: ContainerClient,
  ) {}

  async uploadReportingData({
    data,
    uploadDate,
  }: {
    data: PushInstanceReportingDataResponseDto;
    uploadDate: string;
  }): Promise<void> {
    const instanceSlug = env.ENV_NAME!.toLowerCase().replace(/\s+/g, '-');

    await Promise.all([
      this.uploadJson({
        blobPath: `${uploadDate}/registrations/${instanceSlug}.json`,
        content: data.registrations,
      }),
      this.uploadJson({
        blobPath: `${uploadDate}/transactions/${instanceSlug}.json`,
        content: data.transactions,
      }),
    ]);
  }

  private async uploadJson({
    blobPath,
    content,
  }: {
    blobPath: string;
    content: unknown;
  }): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
    const jsonContent = JSON.stringify(content);
    await blockBlobClient.upload(jsonContent, Buffer.byteLength(jsonContent), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
  }
}
