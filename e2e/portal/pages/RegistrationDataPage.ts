import { Locator, Page } from 'playwright';

import DialogComponent from '../components/DialogComponent';
import BasePage from './BasePage';

class RegistrationDataPage extends BasePage {
  readonly addKoboToolboxButton: Locator;
  readonly continueButton: Locator;
  readonly koboCardEllipsisMenu: Locator;
  readonly koboCard: Locator;
  readonly initiateImportButton: Locator;
  readonly koboSuccessfullyLinkedDialog: Locator;
  readonly importDialog: Locator;
  readonly closeImportDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.koboCard = this.page.getByTestId('kobo-integration-card');
    this.addKoboToolboxButton = this.page
      .getByTestId('card-with-link')
      .getByTitle('KoboToolbox');
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
    this.importDialog = this.page.getByTestId(
      'import-existing-kobo-registrations-dialog',
    );
    this.koboSuccessfullyLinkedDialog = this.page
      .getByTestId('kobo-successfully-linked-dialog')
      .locator('.p-dialog');
    this.initiateImportButton = this.page.getByRole('button', {
      name: 'Import registrations',
    });

    this.closeImportDialog = this.page.getByRole('button', {
      name: 'Close',
    });
  }

  async addKoboIntegration(koboIntegrationDetails: {
    url: string;
    apiKey: string;
  }) {
    await this.clickRegistrationDataSection();
    await this.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      apiKey: koboIntegrationDetails.apiKey,
    });
    // Validate success message after adding Kobo integration with correct details
    await this.validateKoboIntegration({
      koboFormName: '25042025 Prototype Sprint',
    });
    // Click continue button to exit the form
    await this.clickContinueButton();

    // Validate modal message after submitting the form
    await this.validateToastMessageAndClose(
      'Kobo form successfully integrated.',
    );

    const dialog = new DialogComponent(this.koboSuccessfullyLinkedDialog);
    await dialog.waitForVisible();
    await dialog.confirm('Close');
  }

  async clickRegistrationDataSection() {
    await this.page.getByRole('link', { name: 'Registration Data' }).click();
  }

  async clickContinueButton() {
    await this.continueButton.first().click();
  }

  async addKoboToolboxIntegration({
    url,
    apiKey,
  }: {
    url: string;
    apiKey: string;
  }) {
    const urlInput = this.page.getByLabel('Kobo form URL');
    const apiKeyInput = this.page.getByLabel('API key');

    await this.addKoboToolboxButton.click();

    // Fill in the form
    await urlInput.fill(url);
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

  async openImportExistingKoboRegistrationsDialog() {
    const ellipsisMenuButton = this.koboCard.getByTestId(
      'ellipsis-menu-button',
    );

    await ellipsisMenuButton.click();
    await this.page.getByText('Import existing reg.').click();
  }
}

export default RegistrationDataPage;
