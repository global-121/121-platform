import { FilterOperator } from 'nestjs-paginate';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createOcwRegistrationForImport,
  getRegistrations,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

// Dynamically create registrations
const registrations = [
  createOcwRegistrationForImport({
    referenceId: 'referenceId1',
    paymentAmountMultiplier: 1,
    addressHouseNumber: 1,
  }),
  createOcwRegistrationForImport({
    referenceId: 'referenceId2',
    paymentAmountMultiplier: 1,
    addressHouseNumber: 2,
  }),
  createOcwRegistrationForImport({
    referenceId: 'referenceId3',
    paymentAmountMultiplier: 2,
    addressHouseNumber: 3,
  }),
  createOcwRegistrationForImport({
    referenceId: 'referenceId4',
    paymentAmountMultiplier: 3,
    addressHouseNumber: 4,
  }),
  createOcwRegistrationForImport({
    referenceId: 'referenceId5',
    programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
    paymentAmountMultiplier: 3,
    addressHouseNumber: null,
  }),
];

const allReferenceIds = registrations.map(
  (registration) => registration.referenceId,
);

async function getMiddleCreatedDateOfRegistrations(
  accessToken: string,
): Promise<Date> {
  return getRegistrations({
    programId: programIdOCW,
    accessToken,
  }).then((response) => {
    const registrations = response.body.data;
    const sortedCreatedDates = registrations
      .map((registration) => new Date(registration.created))
      .sort((a, b) => a.getTime() - b.getTime());

    // Pick the middle date dynamically and adjust by subtracting a few milliseconds
    const middleIndex = Math.floor(sortedCreatedDates.length / 2);
    const middleCreatedDate = new Date(sortedCreatedDates[middleIndex]);
    middleCreatedDate.setMilliseconds(middleCreatedDate.getMilliseconds() - 5);

    return middleCreatedDate;
  });
}

describe('Filter registrations using range', () => {
  let accessToken: string;
  let middleCreatedDate: Date;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await seedIncludedRegistrations(
      registrations.slice(0, 2),
      programIdOCW,
      accessToken,
    );
    await seedIncludedRegistrations(
      registrations.slice(2, 3),
      programIdOCW,
      accessToken,
    );
    await seedIncludedRegistrations(
      registrations.slice(3, 5),
      programIdOCW,
      accessToken,
    );
    middleCreatedDate = await getMiddleCreatedDateOfRegistrations(accessToken);
  });

  it('should filter registration entity-level numeric attributes based on greater than', async () => {
    // Act
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.paymentAmountMultiplier': `${FilterOperator.GT}:2`,
      },
    });
    const data = getRegistrationsResponse.body.data;

    // Assert
    const expectedReferenceIds = [
      registrations[3].referenceId,
      registrations[4].referenceId,
    ];
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration entity-level numeric attributes based on lower than', async () => {
    // Act
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.paymentAmountMultiplier': `${FilterOperator.LT}:2`,
      },
    });
    const data = getRegistrationsResponse.body.data;

    // Assert
    const expectedReferenceIds = [
      registrations[0].referenceId,
      registrations[1].referenceId,
    ];

    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration entity-level numeric attributes based on on between filter', async () => {
    // Act
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.paymentAmountMultiplier': `${FilterOperator.BTW}:2,3`,
      },
    });
    const data = getRegistrationsResponse.body.data;
    // Assert
    const expectedReferenceIds = [
      registrations[2].referenceId,
      registrations[3].referenceId,
      registrations[4].referenceId,
    ];
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration entity-level date attributes based on greater than', async () => {
    // Act
    const getRegistrationsResponseGreater = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.created': `${FilterOperator.GT}:${middleCreatedDate.toISOString()}`,
      },
    });

    const data = getRegistrationsResponseGreater.body.data;

    // Assert
    const expectedReferenceIds = [
      registrations[2].referenceId,
      registrations[3].referenceId,
      registrations[4].referenceId,
    ];
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration entity-level date attributes based on lower than', async () => {
    // Act
    const getRegistrationsResponseGreater = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.created': `${FilterOperator.LT}:${middleCreatedDate.toISOString()}`,
      },
    });

    const data = getRegistrationsResponseGreater.body.data;

    // Assert
    const expectedReferenceIds = [
      registrations[0].referenceId,
      registrations[1].referenceId,
    ];
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration entity-level date attributes based on between filter', async () => {
    // Act
    const getRegistrationsResponseGreater = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.created': `${FilterOperator.BTW}:${middleCreatedDate.toISOString()},${new Date(
          middleCreatedDate.getTime() + 15,
        ).toISOString()}`,
      },
    });
    const data = getRegistrationsResponseGreater.body.data;
    // Assert
    const expectedReferenceIds = [registrations[2].referenceId];
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration attribute data based on greater than', async () => {
    // Act
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.addressHouseNumber': `${FilterOperator.GT}:2`,
      },
    });

    const data = getRegistrationsResponse.body.data;

    // Assert
    const expectedReferenceIds = [
      registrations[2].referenceId,
      registrations[3].referenceId,
    ];
    // Registration without addressHouseNumber are not included in the response
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration attribute data based on lower than', async () => {
    // Act
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.addressHouseNumber': `${FilterOperator.LT}:2`,
      },
    });

    const data = getRegistrationsResponse.body.data;

    // Assert
    const expectedReferenceIds = [registrations[0].referenceId];
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should filter registration attribute data based on between filter', async () => {
    // Act
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.addressHouseNumber': `${FilterOperator.BTW}:1,3`, // This also include 1 and 3
      },
    });
    const data = getRegistrationsResponse.body.data;

    // Assert
    const expectedReferenceIds = [
      registrations[0].referenceId,
      registrations[1].referenceId,
      registrations[2].referenceId,
    ];
    expect(data.map((registration) => registration.referenceId)).toEqual(
      expectedReferenceIds,
    );
  });

  it('should not apply greater than filter on non-numeric registratrion data', async () => {
    // Act
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      accessToken,
      filter: {
        'filter.addressStreetName': `${FilterOperator.GT}:z`,
      },
    });
    const data = getRegistrationsResponse.body.data;

    // Assert
    expect(data.map((registration) => registration.referenceId)).toEqual(
      allReferenceIds,
    );
  });
});
