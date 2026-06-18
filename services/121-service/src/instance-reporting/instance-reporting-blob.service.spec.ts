import { ContainerClient } from '@azure/storage-blob';
import { Test } from '@nestjs/testing';
import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';

import { InstanceReportingBlobService } from '@121-service/src/instance-reporting/instance-reporting-blob.service';

jest.mock('@121-service/src/env', () => ({
  env: { ENV_NAME: 'Test Instance' },
}));

describe('InstanceReportingBlobService', () => {
  let service: InstanceReportingBlobService;

  const mockUploadStream = jest.fn();
  const mockGetBlockBlobClient = jest.fn();

  beforeEach(async () => {
    const mockContainerClient = {
      getBlockBlobClient: mockGetBlockBlobClient,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InstanceReportingBlobService,
        {
          provide: ContainerClient,
          useValue: mockContainerClient,
        },
      ],
    }).compile();

    service = moduleRef.get(InstanceReportingBlobService);

    jest.resetAllMocks();

    mockGetBlockBlobClient.mockReturnValue({ uploadStream: mockUploadStream });
    mockUploadStream.mockResolvedValue(undefined);
  });

  it('should use hyphenated ENV_NAME and uploadDate in blob paths', async () => {
    await service.uploadReportingData({
      data: { registrations: [], transactions: [] },
      uploadDate: '2026-04-20',
    });

    const calls = mockGetBlockBlobClient.mock.calls.map((call) => call[0]);
    expect(calls).toContain('2026-04-20/registrations/Test-Instance.csv');
    expect(calls).toContain('2026-04-20/transactions/Test-Instance.csv');
  });

  it('should stream CSV with header and data rows for registrations and transactions', async () => {
    const uploadedStreams = new Map<string, Readable>();
    mockGetBlockBlobClient.mockImplementation((blobPath: string) => ({
      uploadStream: (stream: Readable) => {
        uploadedStreams.set(blobPath, stream);
        return Promise.resolve();
      },
    }));

    await service.uploadReportingData({
      data: {
        registrations: [
          {
            instance: 'a',
            version: '1',
            programTitle: 'P1',
            programId: 1,
            status: 'included',
            referenceId: 'ref-1',
            createdDate: '2026-04-19T00:00:00.000Z',
            preferredLanguage: 'en',
            fspName: 'Safaricom',
            paymentAmountMultiplier: 1,
            maxPayments: 3,
            uploadDate: '2026-04-20',
          },
        ],
        transactions: [
          {
            instance: 'a',
            version: '1',
            programId: 1,
            programTitle: 'P1',
            id: 42,
            status: 'success',
            amountEuro: 100,
            amount: 5000,
            localCurrency: 'ETB',
            createdDate: '2026-04-20T10:00:00.000Z',
            startedDate: '2026-04-20T11:00:00.000Z',
            updatedDate: '2026-04-20T12:00:00.000Z',
            registrationReferenceId: 'ref-1',
            uploadDate: '2026-04-20',
          },
        ],
      },
      uploadDate: '2026-04-20',
    });

    const registrationsCsv = await text(
      uploadedStreams.get('2026-04-20/registrations/Test-Instance.csv')!,
    );
    const transactionsCsv = await text(
      uploadedStreams.get('2026-04-20/transactions/Test-Instance.csv')!,
    );

    expect(registrationsCsv).toBe(
      'instance,version,programTitle,programId,status,referenceId,createdDate,preferredLanguage,fspName,paymentAmountMultiplier,maxPayments,uploadDate\n' +
        'a,1,P1,1,included,ref-1,2026-04-19T00:00:00.000Z,en,Safaricom,1,3,2026-04-20\n',
    );
    expect(transactionsCsv).toBe(
      'instance,version,programId,programTitle,id,status,amountEuro,amount,localCurrency,createdDate,startedDate,updatedDate,registrationReferenceId,uploadDate\n' +
        'a,1,1,P1,42,success,100,5000,ETB,2026-04-20T10:00:00.000Z,2026-04-20T11:00:00.000Z,2026-04-20T12:00:00.000Z,ref-1,2026-04-20\n',
    );
  });
});
