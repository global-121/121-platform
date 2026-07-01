import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { getFspLabels } from './get-fsp-labels.helper';

const configuredFsps = getFspLabels({
  fsps: [Fsps.intersolveVisa, Fsps.intersolveVoucherWhatsapp],
});

const availableFsps = getFspLabels({
  fsps: [
    Fsps.excel,
    Fsps.intersolveVoucherPaper,
    Fsps.safaricom,
    Fsps.airtel,
    Fsps.commercialBankEthiopia,
    Fsps.nedbank,
    Fsps.onafriq,
    Fsps.mtn,
  ],
});

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
});

test('Validate that only configured FSPs are present as configured', async ({
  homePage,
  registrationsPage,
  fspSettingsPage,
}) => {
  // await test.step('Navigate to program', async () => {
  //   await homePage.selectProgram('NLRC OCW program');
  // });
  // await test.step('Navigate to FSP configuration', async () => {
  //   await registrationsPage.navigateToProgramPage('Settings');
  //   await fspSettingsPage.clickEditFspSection();
  // });
  // await test.step('Validate only assigned FSPs are visible at first', async () => {
  //   await fspSettingsPage.validateFspVisibility({ fspNames: configuredFsps });
  // });
  // await test.step('Validate unassigned FSPs are not visible', async () => {
  //   await fspSettingsPage.validateFspVisibility({
  //     fspNames: availableFsps,
  //     visible: false,
  //   });
  // });
  // await test.step('Validate that both assigned and configurable FSPs are visible', async () => {
  //   await fspSettingsPage.clickAddAnotherFspButton();
  //   await fspSettingsPage.validateFspVisibility({
  //     fspNames: [...configuredFsps, ...availableFsps],
  //   });
  // });
});
