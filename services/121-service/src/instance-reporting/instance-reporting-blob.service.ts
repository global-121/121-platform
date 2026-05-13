import { ContainerClient } from '@azure/storage-blob';
import { Inject, Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';

import { env } from '@121-service/src/env';
import { PushInstanceReportingDataResponseDto } from '@121-service/src/instance-reporting/dtos/push-instance-reporting-data-response.dto';
import { InstanceReportingCsvMapper } from '@121-service/src/instance-reporting/mappers/instance-reporting-csv.mapper';

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
    const instanceSlug = env.ENV_NAME!.replace(/\s+/g, '-');

    await Promise.all([
      this.uploadCsvStream({
        blobPath: `${uploadDate}/registrations/${instanceSlug}.csv`,
        headers: InstanceReportingCsvMapper.registrationHeaders,
        items: data.registrations,
      }),
      this.uploadCsvStream({
        blobPath: `${uploadDate}/transactions/${instanceSlug}.csv`,
        headers: InstanceReportingCsvMapper.transactionHeaders,
        items: data.transactions,
      }),
    ]);
  }

  private async uploadCsvStream<T extends object>({
    blobPath,
    headers,
    items,
  }: {
    blobPath: string;
    headers: (keyof T & string)[];
    items: T[];
  }): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
    const stream = this.createCsvStream({ headers, items });

    await blockBlobClient.uploadStream(stream, undefined, undefined, {
      blobHTTPHeaders: { blobContentType: 'text/csv' },
    });
  }

  private createCsvStream<T extends object>({
    headers,
    items,
  }: {
    headers: (keyof T & string)[];
    items: T[];
  }): Readable {
    function* generate() {
      yield InstanceReportingCsvMapper.toCsvRow({ values: headers });
      for (const item of items) {
        yield InstanceReportingCsvMapper.mapItemToCsvRow({ headers, item });
      }
    }

    return Readable.from(generate());
  }
}
