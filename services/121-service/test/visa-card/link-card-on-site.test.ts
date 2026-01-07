import { HttpStatus } from '@nestjs/common';

import { IntersolveVisaWalletDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/internal/intersolve-visa-wallet.dto';
import { VisaCard121Status } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/wallet-status-121.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import {
  createAndStartPayment,
  getTransactionsByPaymentIdPaginated,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { updateProgramCardDistributionByMail } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getVisaWalletsAndDetails,
  linkVisaCardOnSite,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Link Visa debit card on site', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully link a Visa Debit card on site', async () => {
    const tokenCode = '1111222233334444555';
    // Arrange
    await seedIncludedRegistrations(
      [registrationVisa],
      programIdVisa,
      accessToken,
    );

    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: false,
      accessToken,
    });

    // Act
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: registrationVisa.referenceId,
      accessToken,
      tokenCode,
    });

    const getVisaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );
    const parentWallet = getVisaWalletResponse.body as IntersolveVisaWalletDto;

    const card = parentWallet.cards[0];

    // Assert
    expect(response.status).toBe(HttpStatus.CREATED);

    expect(card.tokenCode).toBe(tokenCode);
    expect(card.status).toBe(VisaCard121Status.Active);
  });

  it('should throw when linking a Visa Debit card that is already linked', async () => {
    const tokenCode = '2222333344445555666'; // mock already linked token code
    const uniqueRegistration = {
      ...registrationVisa,
      referenceId: 'unique-ref-id-1234',
    };
    // Arrange
    await seedIncludedRegistrations(
      [uniqueRegistration],
      programIdVisa,
      accessToken,
    );

    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: false,
      accessToken,
    });

    const getVisaWalletResponse = await getVisaWalletsAndDetails(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    // Act
    await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    // Assert
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toMatchInlineSnapshot(
      `"Card is already linked to someone else."`,
    );
    expect(getVisaWalletResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should throw when linking a Visa Debit card that does not exist', async () => {
    const tokenCode = '3333444455556666777'; //mock non-existent token code
    const uniqueRegistration = {
      ...registrationVisa,
      referenceId: 'unique-ref-id-2345',
    };
    // Arrange
    await seedIncludedRegistrations(
      [uniqueRegistration],
      programIdVisa,
      accessToken,
    );

    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: false,
      accessToken,
    });

    // Act
    await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    // Assert
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    expect(response.body.message).toMatchInlineSnapshot(
      `"Card with code 3333444455556666777 is not found."`,
    );
  });

  it('should throw when card distribution by mail is enabled', async () => {
    const tokenCode = '5555666677778888999';
    const uniqueRegistration = {
      ...registrationVisa,
      referenceId: 'unique-ref-id-3456',
    };
    // Arrange
    await seedIncludedRegistrations(
      [uniqueRegistration],
      programIdVisa,
      accessToken,
    );

    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: true,
      accessToken,
    });

    //act
    const response = await linkVisaCardOnSite({
      programId: programIdVisa,
      referenceId: uniqueRegistration.referenceId,
      accessToken,
      tokenCode,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toMatchInlineSnapshot(
      `"Linking a card on-site is not allowed when card distribution by mail is enabled."`,
    );
  });

  it('should throw when doing a payment to a registration without a linked Visa Debit card', async () => {
    const uniqueRegistration = {
      ...registrationVisa,
      referenceId: 'unique-ref-id-4567',
    };
    // Arrange
    await seedIncludedRegistrations(
      [uniqueRegistration],
      programIdVisa,
      accessToken,
    );

    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: false,
      accessToken,
    });

    // Act
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdVisa,
      transferValue: 1000,
      referenceIds: [uniqueRegistration.referenceId],
      accessToken,
    });

    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: [uniqueRegistration.referenceId],
      paymentId,
      accessToken,
      maxWaitTimeMs: 10_000,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
    const getTransactionsResult = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
      paymentId,
      registrationReferenceId: uniqueRegistration.referenceId,
      accessToken,
    });
    const transaction = getTransactionsResult.body.data[0];

    // Assert
    expect(transaction.status).toBe(TransactionStatusEnum.error);
    expect(transaction.errorMessage).toMatchInlineSnapshot(
      `"Cannot do a transaction when card distribution by mail is disabled and customer does not exist."`,
    );
  });
});
