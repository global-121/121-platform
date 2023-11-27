import { LanguageEnum } from '../models/person.model';
import {
  DistributionFrequency,
  Program,
  ProgramPhase,
} from '../models/program.model';
import { getRandomInt } from './helpers';

const programsArray: Program[] = [
  {
    id: 1,
    titlePortal: { en: 'Program Alpha' },
    titlePaApp: { en: 'Program Alpha' },
    description: { en: 'Description of program' },
    location: 'Location',
    startDate: '1970-01-01T01:01:01Z',
    currency: 'EUR',
    distributionFrequency: DistributionFrequency.month,
    distributionDuration: getRandomInt(1, 12),
    fixedTransferValue: getRandomInt(10, 1000),
    created: '1970-01-01T01:01:01Z',
    updated: '1970-01-01T01:01:01Z',
    phase: ProgramPhase.design,
    validation: false,
    author: {},
    published: false,
    notifications: { en: 'Notification text' },
    programCustomAttributes: [
      {
        id: 1,
        name: 'namePartnerOrganization',
        type: 'string',
        programId: 1,
        phases: [],
        label: {
          en: 'Partner Organization',
        },
      },
    ],
    programQuestions: [
      {
        id: 1,
        name: 'phoneNumber',
        answerType: 'tel',
        label: {
          en: 'Phone Number',
        },
        options: null,
        phases: [],
        duplicateCheck: false,
        shortLabel: { en: 'Phone Number' },
      },
    ],
    languages: [LanguageEnum.en],
    enableMaxPayments: true,
    financialServiceProviders: [],
    aidworkerAssignments: [],
    fullnameNamingConvention: [],
    paTableAttributes: [],
    filterableAttributes: [],
  },
];
// Copy 2:
programsArray[1] = programsArray[0];
programsArray[1].id = 2;
programsArray[1].titlePortal = { en: 'Program Bravo' };
programsArray[1].created = '1970-01-02T01:01:01Z';
programsArray[1].updated = '1970-01-02T01:01:01Z';

// Copy 3:
programsArray[2] = programsArray[0];
programsArray[2].id = 3;
programsArray[2].titlePortal = { en: 'Program Charlie' };
programsArray[2].created = '1970-01-03T01:01:01Z';
programsArray[2].updated = '1970-01-03T01:01:01Z';

// Copy 4:
programsArray[3] = programsArray[0];
programsArray[3].id = 4;
programsArray[3].titlePortal = { en: 'Program Delta' };
programsArray[3].created = '1970-01-04T01:01:01Z';
programsArray[3].updated = '1970-01-04T01:01:01Z';

export default {
  programs: programsArray,
  programsCount: programsArray.length,
};
