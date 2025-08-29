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
    projects: [],
    includeDebugScopes: true,
    firstProjectId: 1,
  },
  {
    name: SeedScript.nlrcMultiple,
    organization: 'organization-nlrc.json',
    projects: [
      {
        project: 'project-nlrc-pv.json',
        messageTemplate: messageTemplateNlrcPv,
      },
      {
        project: 'project-nlrc-ocw.json',
        messageTemplate: messageTemplateNlrcOcw,
      },
    ],
    includeDebugScopes: true,
    firstProjectId: 2,
  },
  {
    name: SeedScript.nlrcMultipleMock,
    organization: 'organization-nlrc.json',
    projects: [
      {
        project: 'project-nlrc-pv.json',
        messageTemplate: messageTemplateNlrcPv,
      },
      {
        project: 'project-nlrc-ocw.json',
        messageTemplate: messageTemplateNlrcOcw,
      },
    ],
    includeDebugScopes: true,
    includeMockData: true,
    firstProjectId: 2,
  },
  {
    name: SeedScript.cbeProject,
    organization: 'organization-generic.json',
    projects: [
      {
        project: 'project-cbe.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.safaricomProject,
    organization: 'organization-generic.json',
    projects: [
      {
        project: 'project-safaricom.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.airtelProject,
    organization: 'organization-generic.json',
    projects: [
      {
        project: 'project-airtel.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.nedbankProject,
    organization: 'organization-generic.json',
    projects: [
      {
        project: 'project-nedbank.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.onafriqProject,
    organization: 'organization-generic.json',
    projects: [
      {
        project: 'project-onafriq.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
  {
    name: SeedScript.demoProjects,
    organization: 'organization-generic.json',
    projects: [
      {
        project: 'demo-project-mobile-money.json',
        messageTemplate: demoMessageTemplates,
        registrations: 'mobile-money-999.csv',
      },
      {
        project: 'demo-project-bank-transfer.json',
        messageTemplate: demoMessageTemplates,
        registrations: 'bank-transfer-250.csv',
      },
      {
        project: 'project-nlrc-ocw.json',
        messageTemplate: messageTemplateNlrcOcw,
        registrations: 'nlrc-ocw-999.csv',
      },
      {
        project: 'demo-project-excel.json',
        messageTemplate: demoMessageTemplates,
        registrations: 'excel-999.csv',
      },
    ],
    includeDebugScopes: true,
  },
  {
    name: SeedScript.testMultiple,
    organization: 'organization-generic.json',
    projects: [
      {
        project: 'project-cbe.json', // The test seed has multiple projects, because some tests scenarios only occur with multiple project
        messageTemplate: messageTemplateGeneric,
      },
      {
        project: 'project-test.json',
        messageTemplate: messageTemplateGeneric,
      },
    ],
  },
];
