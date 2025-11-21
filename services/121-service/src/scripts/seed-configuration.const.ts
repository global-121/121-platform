import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { demoMessageTemplates } from '@121-service/src/seed-data/message-template/demo-message-template-mobile-money.const';
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
    programs: [
      {
        program: 'program-cbe.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.cooperativeBankOfOromiaProgram,
    programs: [
      {
        program: 'program-cooperative-bank-of-oromia.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.safaricomProgram,
    programs: [
      {
        program: 'program-safaricom.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.airtelProgram,
    programs: [
      {
        program: 'program-airtel.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.nedbankProgram,
    programs: [
      {
        program: 'program-nedbank.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.onafriqProgram,
    programs: [
      {
        program: 'program-onafriq.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.demoPrograms,
    programs: [
      {
        program: 'demo-program-mobile-money.json',
        messageTemplate: demoMessageTemplates,
        registrations: 'mobile-money-999.csv',
      },
      {
        program: 'demo-program-bank-transfer.json',
        messageTemplate: demoMessageTemplates,
        registrations: 'bank-transfer-250.csv',
      },
      {
        program: 'program-nlrc-ocw.json',
        messageTemplate: messageTemplateNlrcOcw,
        registrations: 'nlrc-ocw-999.csv',
      },
      {
        program: 'demo-program-excel.json',
        messageTemplate: demoMessageTemplates,
        registrations: 'excel-999.csv',
      },
    ],
    includeDebugScopes: true,
  },
  {
    name: SeedScript.testMultiple,
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
