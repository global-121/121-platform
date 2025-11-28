import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getImportFspReconciliationTemplate,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  programIdWesteros,
  registrationWesteros1,
  registrationWesteros2,
  registrationWesteros3,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Reconciliate excel FSP data', () => {
  // Payment info
  const transferValue = 10;

  // Registrations
  const registrationsWesteros = [
    registrationWesteros1,
    registrationWesteros2,
    registrationWesteros3,
  ];

  // No need to reset DB before each test
  beforeAll(async () => {
    await resetDB(SeedScript.testMultiple, __filename);

    await seedPaidRegistrations({
      registrations: registrationsWesteros,
      programId: programIdWesteros,
      transferValue,
      completeStatuses: [TransactionStatusEnum.waiting],
    });
  });

  it('should give me a CSV template when I request it', async () => {
    const response =
      await getImportFspReconciliationTemplate(programIdWesteros);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.sort()).toMatchSnapshot();
  });

  // TODO: Add more diverse tests for one program fsp configuration
});
