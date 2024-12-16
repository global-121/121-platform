import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';

export const SEED_CONFIGURATION_SETTINGS: SeedConfigurationDto[] = [
  {
    name: SeedScript.nlrcMultiple,
    organization: 'organization-nlrc.json',
    programs: [
      {
        program: 'program-nlrc-pv.json',
        messageTemplate: 'message-template-nlrc-pv.json',
      },
      {
        program: 'program-nlrc-ocw.json',
        messageTemplate: 'message-template-nlrc-ocw.json',
      },
    ],
    includeDebugScopes: true,
    firstProgramId: 2,
  },
  {
    name: SeedScript.nlrcMultipleMock,
    organization: 'organization-nlrc.json',
    programs: [
      {
        program: 'program-nlrc-pv.json',
        messageTemplate: 'message-template-nlrc-pv.json',
      },
      {
        program: 'program-nlrc-ocw.json',
        messageTemplate: 'message-template-nlrc-ocw.json',
      },
    ],
    includeDebugScopes: true,
    includeMockData: true,
    firstProgramId: 2,
  },
  {
    name: SeedScript.cbeProgram,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-cbe.json',
        messageTemplate: 'message-template-generic.json',
      },
    ],
  },
  {
    name: SeedScript.safaricomProgram,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-safaricom.json',
        messageTemplate: 'message-template-generic.json',
      },
    ],
  },
  {
    name: SeedScript.nedbankProgram,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-nedbank.json',
        messageTemplate: 'message-template-generic.json',
      },
    ],
  },
  {
    name: SeedScript.testMultiple,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-cbe.json', // The test seed has multiple programs, because some tests scenarios only occur with multiple program
        messageTemplate: 'message-template-generic.json',
      },
      {
        program: 'program-test.json',
        messageTemplate: 'message-template-generic.json',
      },
    ],
  },
];
