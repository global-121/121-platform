import { Locator, Page } from 'playwright';

import BasePage from './BasePage';

class RegistrationDataPage extends BasePage {
  readonly addKoboToolboxButton: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addKoboToolboxButton = this.page
      .getByTestId('card-with-link')
      .getByTitle('KoboToolbox');
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
  }

  async clickRegistrationDataSection() {
    await this.page.getByRole('link', { name: 'Registration Data' }).click();
  }

  async clickContinueButton() {
    await this.continueButton.first().click();
  }

  async addKoboToolboxIntegration({
    url,
    assetId,
    apiKey,
  }: {
    url: string;
    assetId: string;
    apiKey: string;
  }) {
    const urlInput = this.page.getByLabel('Kobo server URL');
    const assetIdInput = this.page.getByLabel('Kobo asset ID');
    const apiKeyInput = this.page.getByLabel('API key');

    await this.addKoboToolboxButton.click();

    // Fill in the form
    await urlInput.fill(url);
    await assetIdInput.fill(assetId);
    await apiKeyInput.fill(apiKey);

    await this.clickContinueButton();
  }

  async validateKoboIntegration({
    message,
    koboFormName,
  }: {
    message?: string;
    koboFormName?: string;
  }) {
    if (message) {
      await this.page.getByText(message).waitFor();
    }
    if (koboFormName) {
      await this.page.getByText(koboFormName).waitFor();
    }
  }
}

export default RegistrationDataPage;
