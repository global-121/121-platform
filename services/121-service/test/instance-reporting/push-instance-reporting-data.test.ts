import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { retrieveAndStoreAllExchangeRates } from '@121-service/test/helpers/exchange-rate.helper';
import { pushInstanceReportingData } from '@121-service/test/helpers/instance-reporting.helper';
import { patchProgram } from '@121-service/test/helpers/program.helper';
import {
  seedIncludedRegistrations,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationOCW1,
  registrationOCW2,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

async function changeProgramCurrencyToKes({
  accessToken,
}: {
  accessToken: string;
}): Promise<void> {
  await patchProgram(programIdOCW, { currency: CurrencyCode.KES }, accessToken);
}

describe('Push instance reporting data', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
    await changeProgramCurrencyToKes({ accessToken });
  });

  it('should return 200 with empty registration and transaction arrays when no registrations exist', async () => {
    // Act
    const response = await pushInstanceReportingData(accessToken);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.registrations).toEqual([]);
    expect(response.body.transactions).toEqual([]);
  });

  it('should only return registrations that have at least one successful transaction', async () => {
    // Arrange - seed registrations in two programs but only pay one
    await seedIncludedRegistrations(
      [registrationOCW2],
      programIdOCW,
      accessToken,
    );
    await seedPaidRegistrations({
      registrations: [registrationOCW1],
      programId: programIdOCW,
      transferValue: 10,
    });

    // Act
    const response = await pushInstanceReportingData(accessToken);

    // Assert - only registrationOCW1 has a successful transaction
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.registrations).toHaveLength(1);
    expect(response.body.registrations[0]).toEqual(
      expect.objectContaining({
        programId: programIdOCW,
        status: RegistrationStatusEnum.included,
      }),
    );
  });

  it('should return registration data with correct structure', async () => {
    // Arrange
    await seedPaidRegistrations({
      registrations: [registrationOCW1],
      programId: programIdOCW,
      transferValue: 10,
    });
    await seedPaidRegistrations({
      registrations: [registrationPV5],
      programId: programIdPV,
      transferValue: 10,
    });

    // Act
    const response = await pushInstanceReportingData(accessToken);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);

    const sortedRegistrations = [...response.body.registrations].sort(
      (a: { programId: number }, b: { programId: number }) =>
        a.programId - b.programId,
    );

    expect(sortedRegistrations).toMatchInlineSnapshot(
      [
        {
          instance: expect.any(String),
          referenceId: expect.any(String),
          uploadDate: expect.any(String),
        },
        {
          instance: expect.any(String),
          referenceId: expect.any(String),
          uploadDate: expect.any(String),
        },
      ],
      `
     [
       {
         "instance": Any<String>,
         "programId": 2,
         "programTitle": "NLRC Direct Digital Aid Program (PV)",
         "referenceId": Any<String>,
         "status": "included",
         "uploadDate": Any<String>,
       },
       {
         "instance": Any<String>,
         "programId": 3,
         "programTitle": "NLRC OCW program",
         "referenceId": Any<String>,
         "status": "included",
         "uploadDate": Any<String>,
       },
     ]
    `,
    );
  });

  it('should return transaction data with correct structure after making a payment', async () => {
    // Arrange
    await retrieveAndStoreAllExchangeRates(accessToken);
    const transferValue = 25;

    // Seed across programs to verify program-specific data is returned correctly (e.g. program title, currency)
    await seedPaidRegistrations({
      registrations: [registrationOCW1],
      programId: programIdOCW,
      transferValue,
    });
    await seedPaidRegistrations({
      registrations: [registrationPV5],
      programId: programIdPV,
      transferValue,
    });

    // Act
    const response = await pushInstanceReportingData(accessToken);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.registrations.length).toBeGreaterThanOrEqual(2);
    expect(response.body.transactions.length).toBeGreaterThanOrEqual(2);

    const sortedTransactions = [...response.body.transactions].sort(
      (a: { programId: number }, b: { programId: number }) =>
        a.programId - b.programId,
    );

    expect(sortedTransactions).toMatchInlineSnapshot(
      [
        {
          id: expect.any(Number),
          instance: expect.any(String),
          createdDate: expect.any(String),
          updatedDate: expect.any(String),
          uploadDate: expect.any(String),
        },
        {
          id: expect.any(Number),
          instance: expect.any(String),
          createdDate: expect.any(String),
          updatedDate: expect.any(String),
          uploadDate: expect.any(String),
        },
      ],
      `
     [
       {
         "amount": 25,
         "amountEuro": 25,
         "createdDate": Any<String>,
         "id": Any<Number>,
         "instance": Any<String>,
         "localCurrency": "EUR",
         "programId": 2,
         "programTitle": "NLRC Direct Digital Aid Program (PV)",
         "registrationReferenceId": "44e62864557597e0d",
         "status": "success",
         "updatedDate": Any<String>,
         "uploadDate": Any<String>,
       },
       {
         "amount": 25,
         "amountEuro": 0.19,
         "createdDate": Any<String>,
         "id": Any<Number>,
         "instance": Any<String>,
         "localCurrency": "KES",
         "programId": 3,
         "programTitle": "NLRC OCW program",
         "registrationReferenceId": "63e62864557597e0d",
         "status": "success",
         "updatedDate": Any<String>,
         "uploadDate": Any<String>,
       },
     ]
    `,
    );
  });
});
