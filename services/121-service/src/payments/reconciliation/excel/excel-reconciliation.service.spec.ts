import { Test, TestingModule } from '@nestjs/testing';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { ExcelRecociliationService } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

describe('ExcelRecociliationService', () => {
  let excelReconciliationService: ExcelRecociliationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelRecociliationService,
        FileImportService,
        {
          provide: RegistrationViewScopedRepository,
          useValue: {},
        },
        ProgramService,
        RegistrationsPaginationService,
        ExcelService,
        TransactionsService,
        {
          provide: ActionsService,
          useValue: {},
        },
      ],
    }).compile();

    excelReconciliationService = module.get<ExcelRecociliationService>(
      ExcelRecociliationService,
    );
  });

  it('should be defined', () => {
    expect(excelReconciliationService).toBeDefined();
  });
});
