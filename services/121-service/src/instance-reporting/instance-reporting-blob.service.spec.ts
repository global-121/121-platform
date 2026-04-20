import { ContainerClient } from '@azure/storage-blob';
import { Test } from '@nestjs/testing';

import { InstanceReportingBlobService } from '@121-service/src/instance-reporting/instance-reporting-blob.service';

jest.mock('@121-service/src/env', () => ({
  env: { ENV_NAME: 'Test Instance' },
}));

describe('InstanceReportingBlobService', () => {
  let service: InstanceReportingBlobService;

  const mockUpload = jest.fn();
  const mockUploadStream = jest.fn();

  beforeEach(async () => {
    const mockContainerClient = {
      getBlockBlobClient: jest.fn().mockReturnValue({
        upload: mockUpload,
        uploadStream: mockUploadStream,
      }),
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

    // Re-apply mock after resetAllMocks
    mockContainerClient.getBlockBlobClient.mockReturnValue({
      upload: mockUpload,
      uploadStream: mockUploadStream,
    });

    mockUpload.mockResolvedValue(undefined);
    mockUploadStream.mockResolvedValue(undefined);
  });

  describe('blob path construction', () => {
    it('should use hyphenated ENV_NAME and uploadDate in blob paths', async () => {
      const mockContainerClient = service['containerClient'] as unknown as {
        getBlockBlobClient: jest.Mock;
      };

      await service.uploadReportingData({
        data: { registrations: [], transactions: [] },
        uploadDate: '2026-04-20',
      });

      const calls = mockContainerClient.getBlockBlobClient.mock.calls.map(
        (call: string[]) => call[0],
      );
      expect(calls).toContain('2026-04-20/registrations/Test-Instance.csv');
      expect(calls).toContain('2026-04-20/transactions/Test-Instance.csv');
    });
  });

  describe('empty data', () => {
    it('should upload header-only CSV when items array is empty', async () => {
      await service.uploadReportingData({
        data: { registrations: [], transactions: [] },
        uploadDate: '2026-04-20',
      });

      expect(mockUpload).toHaveBeenCalledTimes(2);
      expect(mockUpload).toHaveBeenCalledWith(
        'instance,version,programTitle,programId,status,referenceId,uploadDate\n',
        expect.any(Number),
        { blobHTTPHeaders: { blobContentType: 'text/csv' } },
      );
      expect(mockUploadStream).not.toHaveBeenCalled();
    });
  });

  describe('non-empty data', () => {
    it('should use uploadStream for non-empty items', async () => {
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
              uploadDate: '2026-04-20',
            },
          ],
          transactions: [],
        },
        uploadDate: '2026-04-20',
      });

      // registrations via stream, transactions via upload (empty)
      expect(mockUploadStream).toHaveBeenCalledTimes(1);
      expect(mockUpload).toHaveBeenCalledTimes(1);
    });
  });
});
