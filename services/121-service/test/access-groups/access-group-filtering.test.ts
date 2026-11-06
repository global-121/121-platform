import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  AccessGroupPath,
  getAccessGroupAssignments,
  getAccessGroupRegistrationValues,
  setupAccessGroupLevels,
} from '@121-service/test/helpers/access-group.helper';
import {
  createPayment,
  getTransactionsByPaymentIdPaginated,
} from '@121-service/test/helpers/program.helper';
import {
  getRegistrations,
  getTransactionEvents,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

interface FilteringScenario {
  scenario: string;
  accessGroupPath?: AccessGroupPath; // undefined: a user without access groups
  expectedRegistrations: { referenceId: string }[];
}

describe('Access groups - filtering', () => {
  const programId = 1;
  // Registrations sharing a phone number or national id become duplicates, which blocks starting a payment
  let nextUniqueNumber = 254708374200;

  const registrationPaths: AccessGroupPath[] = [];
  const createRegistration = ({ path }: { path?: AccessGroupPath }) => {
    if (path) {
      registrationPaths.push(path);
    }
    const name = path ? path.replaceAll('/', '_') : 'none';
    const uniqueNumber = String(nextUniqueNumber++);
    return {
      referenceId: `access-group-${name}`,
      programFspConfigurationName: Fsps.safaricom,
      phoneNumber: uniqueNumber,
      fullName: name,
      nationalId: uniqueNumber,
      ...(path ? getAccessGroupRegistrationValues({ path }) : {}),
    };
  };

  const haarlemCentrumGrooteMarkt = createRegistration({
    path: 'noord-holland/haarlem/centrum/grote-markt',
  });
  const haarlemOostSlachthuisbuurt = createRegistration({
    path: 'noord-holland/haarlem/oost/slachthuisbuurt',
  });
  const amsterdamCentrumJordaan = createRegistration({
    path: 'noord-holland/amsterdam/centrum/jordaan',
  });
  const noordHollandOnly = createRegistration({ path: 'noord-holland' });
  const haarlemOnly = createRegistration({ path: 'noord-holland/haarlem' });
  // The municipality starts with the municipality of the Haarlem registrations
  const haarlemmermeerHoofddorpOverbos = createRegistration({
    path: 'noord-holland/haarlemmermeer/hoofddorp/overbos',
  });
  const rotterdamDelfshavenBospolder = createRegistration({
    path: 'zuid-holland/rotterdam/delfshaven/bospolder',
  });
  // The district has the same name as the district of the Haarlem Centrum registration
  const rotterdamCentrumOudeWesten = createRegistration({
    path: 'zuid-holland/rotterdam/centrum/oude-westen',
  });
  const withoutAccessGroupValues = createRegistration({});

  const allRegistrations = [
    haarlemCentrumGrooteMarkt,
    haarlemOostSlachthuisbuurt,
    amsterdamCentrumJordaan,
    noordHollandOnly,
    haarlemOnly,
    haarlemmermeerHoofddorpOverbos,
    rotterdamDelfshavenBospolder,
    rotterdamCentrumOudeWesten,
    withoutAccessGroupValues,
  ];

  const filteringScenarios: FilteringScenario[] = [
    {
      scenario:
        'a province user ($accessGroupPath), including registrations with fewer levels and a similar municipality value',
      accessGroupPath: 'noord-holland',
      expectedRegistrations: [
        haarlemCentrumGrooteMarkt,
        haarlemOostSlachthuisbuurt,
        amsterdamCentrumJordaan,
        noordHollandOnly,
        haarlemOnly,
        haarlemmermeerHoofddorpOverbos,
      ],
    },
    {
      scenario:
        'a municipality user ($accessGroupPath), excluding registrations with only a province and a similar municipality value (haarlemmermeer)',
      accessGroupPath: 'noord-holland/haarlem',
      expectedRegistrations: [
        haarlemCentrumGrooteMarkt,
        haarlemOostSlachthuisbuurt,
        haarlemOnly,
      ],
    },
    {
      scenario:
        'a district user ($accessGroupPath), excluding a sibling district and registrations with fewer levels',
      accessGroupPath: 'noord-holland/haarlem/centrum',
      expectedRegistrations: [haarlemCentrumGrooteMarkt],
    },
    {
      scenario: 'a neighbourhood user ($accessGroupPath)',
      accessGroupPath: 'noord-holland/haarlem/centrum/grote-markt',
      expectedRegistrations: [haarlemCentrumGrooteMarkt],
    },
    {
      scenario: 'a user of another province ($accessGroupPath)',
      accessGroupPath: 'zuid-holland',
      expectedRegistrations: [
        rotterdamDelfshavenBospolder,
        rotterdamCentrumOudeWesten,
      ],
    },
    {
      scenario:
        'a district user ($accessGroupPath), excluding the same district name under another province',
      accessGroupPath: 'zuid-holland/rotterdam/centrum',
      expectedRegistrations: [rotterdamCentrumOudeWesten],
    },
    {
      scenario:
        'a user without access groups, including registrations without access group values',
      expectedRegistrations: allRegistrations,
    },
  ];

  let accessTokenAdmin: string;
  let paymentId: number;
  const accessTokens = new Map<AccessGroupPath | undefined, string>();

  const getAccessTokenOfUser = ({
    accessGroupPath,
  }: {
    accessGroupPath?: AccessGroupPath;
  }): string => {
    const accessToken = accessTokens.get(accessGroupPath);
    if (!accessToken) {
      throw new Error(
        `No access token for access group path ${accessGroupPath}`,
      );
    }
    return accessToken;
  };

  const getReferenceIds = ({
    registrations,
  }: {
    registrations: { referenceId: string }[];
  }) => registrations.map(({ referenceId }) => referenceId).sort();

  const getTransactionIdOfRegistration = async ({
    referenceId,
  }: {
    referenceId: string;
  }): Promise<number> => {
    const response = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      accessToken: accessTokenAdmin,
      registrationReferenceId: referenceId,
    });
    return response.body.data[0].id;
  };

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.safaricomProgram });
    accessTokenAdmin = await getAccessToken();

    await setupAccessGroupLevels({
      programId,
      paths: registrationPaths,
      accessToken: accessTokenAdmin,
    });
    paymentId = await seedPaidRegistrations({
      registrations: allRegistrations,
      programId,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });

    for (const { accessGroupPath } of filteringScenarios) {
      accessTokens.set(
        accessGroupPath,
        await createAccessTokenWithPermissions({
          permissions: Object.values(PermissionEnum),
          programId,
          adminAccessToken: accessTokenAdmin,
          accessGroups: accessGroupPath
            ? getAccessGroupAssignments({ path: accessGroupPath })
            : [],
        }),
      );
    }
  });

  describe('registrations list', () => {
    it.each(filteringScenarios)(
      'should return the registrations of $scenario',
      async ({ accessGroupPath, expectedRegistrations }) => {
        // Act
        const response = await getRegistrations({
          programId,
          accessToken: getAccessTokenOfUser({ accessGroupPath }),
          limit: 100,
        });

        // Assert
        expect(response.status).toBe(HttpStatus.OK);
        expect(getReferenceIds({ registrations: response.body.data })).toEqual(
          getReferenceIds({ registrations: expectedRegistrations }),
        );
      },
    );
  });

  describe('transactions of a payment', () => {
    it.each(filteringScenarios)(
      'should return the transactions of the registrations of $scenario',
      async ({ accessGroupPath, expectedRegistrations }) => {
        // Act
        const response = await getTransactionsByPaymentIdPaginated({
          programId,
          paymentId,
          accessToken: getAccessTokenOfUser({ accessGroupPath }),
          limit: 100,
        });

        // Assert
        expect(response.status).toBe(HttpStatus.OK);
        const registrationReferenceIds = response.body.data
          .map(
            (transaction: { registrationReferenceId: string }) =>
              transaction.registrationReferenceId,
          )
          .sort();
        expect(registrationReferenceIds).toEqual(
          getReferenceIds({ registrations: expectedRegistrations }),
        );
      },
    );
  });

  describe('transaction events, which relate to the registration through the transaction', () => {
    // This is mostly a spot check, that checks also entitiies with an indirect relation with registrations are correctly filtered
    it('should only return events of transactions of registrations within the access group of the user', async () => {
      // Arrange
      const accessToken = getAccessTokenOfUser({
        accessGroupPath: 'noord-holland/haarlem/centrum',
      });
      const transactionIdInAccessGroup = await getTransactionIdOfRegistration({
        referenceId: haarlemCentrumGrooteMarkt.referenceId,
      });
      const transactionIdOutsideAccessGroup =
        await getTransactionIdOfRegistration({
          referenceId: haarlemOostSlachthuisbuurt.referenceId,
        });

      // Act
      const responseInAccessGroup = await getTransactionEvents({
        programId,
        transactionId: transactionIdInAccessGroup,
        accessToken,
      });
      const responseOutsideAccessGroup = await getTransactionEvents({
        programId,
        transactionId: transactionIdOutsideAccessGroup,
        accessToken,
      });
      // Assert
      expect(responseInAccessGroup.body.data.length).toBeGreaterThan(0);
      expect(responseOutsideAccessGroup.body.data).toEqual([]);
    });
  });

  describe('payment creation', () => {
    const accessGroupPathsToCreatePaymentWith: (AccessGroupPath | undefined)[] =
      ['noord-holland', 'noord-holland/haarlem/centrum', undefined];

    it.each(
      filteringScenarios.filter(({ accessGroupPath }) =>
        accessGroupPathsToCreatePaymentWith.includes(accessGroupPath),
      ),
    )(
      'should only apply a payment to the registrations of $scenario',
      async ({ accessGroupPath, expectedRegistrations }) => {
        // Act
        const response = await createPayment({
          programId,
          transferValue: 10,
          referenceIds: [],
          accessToken: getAccessTokenOfUser({ accessGroupPath }),
          filter: { 'filter.status': '$in:included' },
        });

        // Assert
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body.applicableCount).toBe(
          expectedRegistrations.length,
        );
      },
    );
  });
});
