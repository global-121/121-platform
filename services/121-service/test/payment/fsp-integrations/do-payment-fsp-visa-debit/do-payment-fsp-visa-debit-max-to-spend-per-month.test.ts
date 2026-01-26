import { HttpStatus } from '@nestjs/common';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa as registrationVisaDefault,
  transferValueVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactionsByPaymentIdPaginated,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { patchProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Do payment with Visa Debit monthly limit', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('caps transaction amount to maxToSpendPerMonthInCents when payment exceeds it', async () => {
    // Arrange
    const maxToSpendPerMonthInCents = 1_000; // 10 in major units
    const expectedMaxTransferValue = maxToSpendPerMonthInCents / 100;

    await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      propertyName: FspConfigurationProperties.maxToSpendPerMonthInCents,
      body: {
        value: String(maxToSpendPerMonthInCents),
      },
      accessToken,
    });

    const registrationVisa = {
      ...registrationVisaDefault,
      whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
      fullName: 'mock-current-balance-0-mock-spent-0',
    };

    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    // Act
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      transferValue: transferValueVisa,
      referenceIds: [registrationVisa.referenceId],
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentAndTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: [registrationVisa.referenceId],
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatuses: [TransactionStatusEnum.success],
      paymentId,
    });

    // Assert
    expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);

    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(transactionsResponse.text).toContain(TransactionStatusEnum.success);
    expect(transactionsResponse.body.data[0].transferValue).toBe(
      expectedMaxTransferValue,
    );
  });
});
