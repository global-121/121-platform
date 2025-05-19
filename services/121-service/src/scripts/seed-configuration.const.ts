import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { messageTemplateGeneric } from '@121-service/src/seed-data/message-template/message-template-generic.const';
import { messageTemplateNlrcOcw } from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.const';
import { messageTemplateNlrcPv } from '@121-service/src/seed-data/message-template/message-template-nlrc-pv.const';

export const SEED_CONFIGURATION_SETTINGS: SeedConfigurationDto[] = [
  {
    name: SeedScript.productionInitialState,
    seedAdminOnly: true,
    programs: [],
    includeDebugScopes: true,
    firstProgramId: 1,
  },
  {
    name: SeedScript.nlrcMultiple,
    organization: 'organization-nlrc.json',
    programs: [
      {
        program: 'program-nlrc-pv.json',
        messageTemplate: messageTemplateNlrcPv,
      },
      {
        program: 'program-nlrc-ocw.json',
        messageTemplate: messageTemplateNlrcOcw,
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
        messageTemplate: messageTemplateNlrcPv,
      },
      {
        program: 'program-nlrc-ocw.json',
        messageTemplate: messageTemplateNlrcOcw,
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
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.safaricomProgram,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-safaricom.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.airtelProgram,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-airtel.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.nedbankProgram,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-nedbank.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.testMultiple,
    organization: 'organization-generic.json',
    programs: [
      {
        program: 'program-cbe.json', // The test seed has multiple programs, because some tests scenarios only occur with multiple program
        messageTemplate: messageTemplateGeneric,
      },
      {
        program: 'program-test.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
];
