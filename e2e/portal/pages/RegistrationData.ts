import { Locator, Page } from 'playwright';

import BasePage from './BasePage';

class RegistrationData extends BasePage {
  readonly addKoboToolBoxButton: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addKoboToolBoxButton = this.page
      .getByTestId('card-with-link')
      .getByTitle('Kobo toolbox');
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
  }

  async clickRegistrationDataSection() {
    await this.page.getByRole('link', { name: 'Registration Data' }).click();
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
    // Click add Kobo toolbox integration button to open the form and fill in the details
    await this.addKoboToolBoxButton.click();
    // Fill in the form
    await urlInput.fill(url);
    await assetIdInput.fill(assetId);
    await apiKeyInput.fill(apiKey);
    // Click continue to save the integration
    await this.continueButton.click();
  }

  async validateKoboInegrationSuccessfulMessage() {
    await this.page
      .getByText('Dry run successful - validation passed')
      .waitFor();
  }

  async validateKoboIntegrationErrorMessage() {
    await this.page
      .getByText(
        'Something went wrong: "Kobo form definition validation failed',
      )
      .waitFor();
  }
}

export default RegistrationData;
