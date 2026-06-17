import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import DialogComponent from '../components/DialogComponent';
import TableComponent from '../components/TableComponent';
import BasePage from './BasePage';

class RegistrationDataPage extends BasePage {
  readonly addKoboToolboxButton: Locator;
  readonly continueButton: Locator;
  readonly koboCardEllipsisMenu: Locator;
  readonly koboCard: Locator;
  readonly initiateImportButton: Locator;
  readonly importDialog: Locator;
  readonly closeImportDialog: Locator;
  readonly languageTabs: Locator;
  readonly programAttributesTable: Locator;

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
    this.initiateImportButton = this.page.getByRole('button', {
      name: 'Import registrations',
    });

    this.closeImportDialog = this.page.getByRole('button', {
      name: 'Close',
    });
    this.languageTabs = this.page.getByTestId('language-tab');
    this.programAttributesTable = this.page.getByTestId(
      'program-attributes-table',
    );
  }

  async koboSuccessfullyLinkedDialog({
    openImportExistingRegistrationsDialog,
    closeDialog,
  }: {
    openImportExistingRegistrationsDialog?: boolean;
    closeDialog?: boolean;
  }) {
    const dialog = new DialogComponent(
      this.page
        .getByTestId('kobo-successfully-linked-dialog')
        .locator('.p-dialog'),
    );
    await dialog.waitForVisible();

    if (closeDialog) {
      await dialog.confirm('Close');
    }

    if (openImportExistingRegistrationsDialog) {
      await dialog.clickButton('Import existing registrations');
    }
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
  }

  async clickRegistrationDataSection() {
    await this.page.getByRole('link', { name: 'Registration Data' }).click();
  }

  async clickContinueButton() {
    await this.continueButton.first().click();
  }

  async validateFspPills({ fspNames }: { fspNames: string[] }) {
    const pillsContainer = this.page.getByTestId('integrated-fsp-list');
    const pills = pillsContainer.locator('.p-tag');
    const pillCount = await pills.count();

    expect(pillCount).toBe(fspNames.length);

    for (const name of fspNames) {
      await expect(pillsContainer).toContainText(name);
    }
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

  async refreshKoboIntegration() {
    const ellipsisMenuButton = this.koboCard.getByTestId(
      'ellipsis-menu-button',
    );

    await ellipsisMenuButton.click();
    await this.page.getByText('Refresh link').click();
  }

  async validateErrorTable() {
    const fileDialogErrorTable = new TableComponent(
      this.page,
      'kobo-import-existing-registration-dialog-errors-table',
    );

    const columnHeaders = await fileDialogErrorTable.getTextArrayFromHeader();
    const rows = await fileDialogErrorTable.tableRows
      .locator('td')
      .allInnerTexts();

    expect(columnHeaders).toEqual(['Reference ID', 'Column', 'Error']);
    expect(rows).toEqual([
      'failure-import-with-failure',
      'programFspConfigurationName',
      'FspConfigurationName undefined not found in program. Allowed values: Safaricom',
    ]);
  }

  async validateLanguageTabs({ languages }: { languages: string[] }) {
    await expect(this.languageTabs).toHaveCount(languages.length);
    for (const [index, language] of languages.entries()) {
      await expect(this.languageTabs.nth(index)).toHaveText(language);
    }
  }

  async validateProgramAttributesTable({
    attributes,
  }: {
    attributes: { name: string; label: string }[];
  }) {
    for (const attribute of attributes) {
      await expect(this.programAttributesTable.nth(0)).toContainText(
        attribute.name,
      );
      await expect(this.programAttributesTable.nth(0)).toContainText(
        attribute.label,
      );
    }
  }

  async validateKoboRequiredFieldsTable({
    requiredDataColumnNames,
  }: {
    requiredDataColumnNames: string[];
  }) {
    const requiredFieldsTable = new TableComponent(
      this.page,
      'required-attributes-table',
    );

    const columnHeaders = await requiredFieldsTable.getTextArrayFromHeader();
    const dataColumnNames = await requiredFieldsTable.tableRows
      .locator('td:nth-child(2)')
      .allInnerTexts();

    const trimmedDataColumnNames = dataColumnNames.map((row) => row.trim());

    expect(columnHeaders).toEqual(['Field', 'Data column name']);
    expect(trimmedDataColumnNames).toEqual(requiredDataColumnNames);
  }

  async validateKoboRequiredFieldsTableNotVisible() {
    const requiredFieldsTable = new TableComponent(
      this.page,
      'required-attributes-table',
    );

    await expect(requiredFieldsTable.table).toBeHidden();
  }
}

export default RegistrationDataPage;
