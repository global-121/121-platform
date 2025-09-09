import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { ExcelRecociliationService } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

const createCsvFile = (csvContents: string, filename = 'test.csv') => {
  const buffer = Buffer.from(csvContents);
  return {
    buffer,
    originalname: filename,
  } as Express.Multer.File;
};

describe('ExcelRecociliationService', () => {
  let service: ExcelRecociliationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelRecociliationService,
        {
          provide: ActionsService,
          useValue: {},
        },
        {
          provide: TransactionsService,
          useValue: {},
        },
        {
          provide: ExcelService,
          useValue: {},
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {},
        },
        {
          provide: FileImportService,
          useValue: {},
        },
        {
          provide: RegistrationViewScopedRepository,
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProgramEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ExcelRecociliationService>(ExcelRecociliationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('processes a reconciliation file', () => {
    // Arrange
    const testFile = createCsvFile('phoneNumber,status\n1234567890,success');
    const programId = 1;
    const paymentId = 1;
    const userId = 1;

    // Act

    const result = service.upsertFspReconciliationData(
      testFile,
      programId,
      paymentId,
      userId,
    );

    // Assert
    expect(result).toBeTruthy();
  });
});
