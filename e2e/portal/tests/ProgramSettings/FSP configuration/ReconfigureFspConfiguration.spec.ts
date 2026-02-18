import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const configuredFsps = [
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const visaConfiguration = [
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  // eslint-disable-next-line n/no-process-env -- Used in seed-data, not in code, so not in '@121-service/src/env'
  process.env.INTERSOLVE_VISA_BRAND_CODE,
  // eslint-disable-next-line n/no-process-env -- Used in seed-data, not in code, so not in '@121-service/src/env'
  process.env.INTERSOLVE_VISA_COVERLETTER_CODE,
  // eslint-disable-next-line n/no-process-env -- Used in seed-data, not in code, so not in '@121-service/src/env'
  process.env.INTERSOLVE_VISA_FUNDINGTOKEN_CODE,
  // eslint-disable-next-line n/no-process-env -- Used in seed-data, not in code, so not in '@121-service/src/env'
  process.env.INTERSOLVE_VISA_CARD_DISTRIBUTION_BY_MAIL,
  // eslint-disable-next-line n/no-process-env -- Used in seed-data, not in code, so not in '@121-service/src/env'
  process.env.INTERSOLVE_VISA_MAX_TO_SPEND_PER_MONTH_IN_CENTS,
].filter((item): item is string => item !== undefined);

const newVisaConfiguration = [
  'PKO BPAY debit card', // Fsp name
  'UI_CPO1', // Brand code
  'RC02', // Cover letter code
  '510121323', // Funding token code
  'true', // Card distribution by mail
  '25000', // Max amount to spend per month in cents
];

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
});

test('Reconfigure FSP', async ({
  homePage,
  registrationsPage,
  fspSettingsPage,
}) => {
  await test.step('Navigate to program', async () => {
    await homePage.selectProgram('NLRC OCW program');
  });

  await test.step('Navigate to FSP configuration', async () => {
    await registrationsPage.navigateToProgramPage('Settings');
    await fspSettingsPage.clickEditFspSection();
  });

  await test.step('Validate that configured FSPs are visible', async () => {
    await fspSettingsPage.validateFspVisibility({
      fspNames: configuredFsps,
    });
  });

  await test.step('Check Visa debit card configuration', async () => {
    await fspSettingsPage.openEditFspConfigurationByName(visaConfiguration[0]);
    await fspSettingsPage.validateFspConfiguration(visaConfiguration);
  });

  await test.step('Reconfigure Visa debit card FSP', async () => {
    await fspSettingsPage.reconfigureFsp(newVisaConfiguration);
  });

  await test.step('Validate new Visa debit card was reconfigured', async () => {
    await fspSettingsPage.openEditFspConfigurationByName(
      newVisaConfiguration[0],
    );
    await fspSettingsPage.validateFspConfiguration(newVisaConfiguration);
  });
});
