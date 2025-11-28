import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getTransactionsByPaymentIdPaginated,
  importFspReconciliationData,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdWesteros,
  registrationWesteros1,
  registrationWesteros2,
  registrationWesteros3,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Reconciliate excel FSP data', () => {
  let accessToken: string;
  // Payment info
  const transferValue = 10;
  const paymentId = 1;
  const differentMatchColumn = 'accountId';

  // Registrations
  const registrationsWesteros = [
    registrationWesteros1,
    registrationWesteros2,
    registrationWesteros3,
  ];
  const phoneNumbersWesteros = registrationsWesteros.map(
    (registration) => registration.phoneNumber,
  );

  const waitingTransactionStatuses = Array(registrationsWesteros.length).fill(
    TransactionStatusEnum.waiting,
  );

  const matchColumn = FspAttributes.phoneNumber;
  const statusColumn = 'status';

  const getTransactionStatuses = async () => {
    // Validate that transactions are still waiting
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdWesteros,
      paymentId,
      accessToken,
    });
    const transactions = transactionsResponse.body.data;
    return transactions.map((transaction) => transaction.status);
  };

  // No need to reset DB before each test, as we will only import reconciliation files unsuccessfully
  beforeAll(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    await seedPaidRegistrations({
      registrations: registrationsWesteros,
      programId: programIdWesteros,
      transferValue,
      completeStatuses: [TransactionStatusEnum.waiting],
    });

    const excelFspConfigWithDifferentMatchColumn = {
      fspName: Fsps.excel,
      name: 'different-match-column-fsp',
      label: {
        en: 'Excel FSP config with different match column',
      },
      properties: [
        {
          name: FspConfigurationProperties.columnsToExport,
          value: [differentMatchColumn],
        },
        {
          name: FspConfigurationProperties.columnToMatch,
          value: differentMatchColumn,
        },
      ],
    };
    await postProgramFspConfiguration({
      programId: programIdWesteros,
      body: excelFspConfigWithDifferentMatchColumn,
      accessToken,
    });
  });

  // NOTE: error because payment is in progress is covered in unit test excel-reconciliation.service.spec.ts

  it('Should give an error when status column is missing', async () => {
    // Arrange
    const reconciliationData = [
      {
        [matchColumn]: registrationWesteros1.phoneNumber,
      },
    ];

    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });
    const transactionStatuses = await getTransactionStatuses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatuses);
  });

  it('Should give an error when status column has invalid values', async () => {
    // Arrange
    const reconciliationData = [
      {
        [matchColumn]: registrationWesteros1.phoneNumber,
        [statusColumn]: 'invalid-status',
      },
    ];

    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });
    const transactionStatuses = await getTransactionStatuses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatuses);
  });

  it('Should give an error when importing over 10.000 records', async () => {
    // Arrange
    const reconciliationData: Record<string, any>[] = [];
    for (let i = 0; i < 10001; i++) {
      reconciliationData.push({
        [matchColumn]: registrationWesteros1.phoneNumber,
        [statusColumn]: TransactionStatusEnum.success,
      });
    }

    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });
    const transactionStatuses = await getTransactionStatuses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatuses);
  });

  it('Should give an error when match there is more than one match column in the import', async () => {
    // Arrange
    const matchColumn1 = FspAttributes.phoneNumber;
    const matchColumn2 = differentMatchColumn;

    const reconciliationData = [
      {
        [matchColumn1]: registrationWesteros1.phoneNumber,
        [statusColumn]: TransactionStatusEnum.success,
      },
      {
        [matchColumn2]: 'something random that does not matter',
        [statusColumn]: TransactionStatusEnum.success,
      },
    ];

    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });
    const transactionStatuses = await getTransactionStatuses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatuses);
  });

  it('Should throw an error when there are duplicate values in the match column', async () => {
    // Arrange

    const reconciliationData = [
      {
        [matchColumn]: registrationWesteros1.phoneNumber,
        [statusColumn]: TransactionStatusEnum.success,
      },
      {
        [matchColumn]: registrationWesteros1.phoneNumber, // duplicate
        [statusColumn]: TransactionStatusEnum.success,
      },
    ];

    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });
    const transactionStatuses = await getTransactionStatuses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatuses);
  });

  it('Should throw an error when importing data that is related to registrations that do not have the same Fsp config', async () => {
    // Arrange
    const reconciliationData = [
      {
        [matchColumn]: phoneNumbersWesteros[0],
        [statusColumn]: TransactionStatusEnum.success,
      },
      {
        [matchColumn]: phoneNumbersWesteros[2], // the registrations has a different FSP
        [statusColumn]: TransactionStatusEnum.success,
      },
    ];
    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });
    const transactionStatuses = await getTransactionStatuses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatuses);
  });

  it('Should throw an error when no transactions are found for the the import', async () => {
    // Arrange

    const reconciliationData = [
      {
        [matchColumn]: '0000000000',
        [statusColumn]: TransactionStatusEnum.success,
      },
    ];

    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });
    const transactionStatuses = await getTransactionStatuses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatuses);
  });
});
