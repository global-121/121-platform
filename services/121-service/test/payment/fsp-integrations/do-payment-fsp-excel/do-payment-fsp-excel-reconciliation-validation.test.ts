import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createPayment,
  getTransactions,
  importFspReconciliationData,
  startPayment,
  waitForPaymentTransactionsToComplete,
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
  const referenceIdsWesteros = registrationsWesteros.map(
    (registration) => registration.referenceId,
  );
  const phoneNumbersWesteros = registrationsWesteros.map(
    (registration) => registration.phoneNumber,
  );

  const waitingTransactionStatusses = Array(registrationsWesteros.length).fill(
    TransactionStatusEnum.waiting,
  );

  const matchColumn = FspAttributes.phoneNumber;
  const statusColumn = 'status';

  const getTransactionStatusses = async () => {
    // Validate that transactions are still waiting
    const transactionsResponse = await getTransactions({
      programId: programIdWesteros,
      paymentId,
      accessToken,
    });
    return transactionsResponse.body.map((transaction) => transaction.status);
  };

  // No need to reset DB before each test, as we will only import reconciliation files unsuccessfully

  beforeAll(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    await seedPaidRegistrations(
      registrationsWesteros,
      programIdWesteros,
      transferValue,
      [TransactionStatusEnum.waiting],
    );

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

  // ##TODO: fix this test as part of refactoring out actions/payment-in-progress
  it.skip('Should throw an error when a payment is in progress', async () => {
    // Arrange
    const reconciliationData = [
      {
        [matchColumn]: registrationWesteros1.phoneNumber,
        [statusColumn]: TransactionStatusEnum.success,
      },
    ];

    const createPaymentResponse = await createPayment({
      programId: programIdWesteros,
      transferValue,
      accessToken,
      referenceIds: referenceIdsWesteros,
    });
    const paymentId = createPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatusses: [TransactionStatusEnum.created],
      paymentReferenceIds: referenceIdsWesteros,
    });
    // Do not await this call, to simulate payment in progress
    void startPayment({
      programId: programIdWesteros,
      paymentId,
      accessToken,
    });

    // Act
    const importResult = await importFspReconciliationData({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      reconciliationData,
    });

    // Wait for payment transactions to complete, so it does not interfere with other tests
    await waitForPaymentTransactionsToComplete({
      programId: programIdWesteros,
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatusses: [TransactionStatusEnum.waiting],
      paymentReferenceIds: referenceIdsWesteros,
    });

    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
  });

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
    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
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
    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
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
    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
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
    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
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
    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
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
    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
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
    const transactionStatuses = await getTransactionStatusses();

    // Assert
    expect(importResult.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(importResult.body).toMatchSnapshot();
    // Expect that all transactions are still waiting after failed reconciliation attempts - no changes should be made
    expect(transactionStatuses).toEqual(waitingTransactionStatusses);
  });
});
