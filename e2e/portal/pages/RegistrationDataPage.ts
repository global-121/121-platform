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
  readonly editLabelsButton: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

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
    this.editLabelsButton = this.page.getByTestId('editable-card-edit-button');
    this.cancelButton = this.page.getByRole('button', {
      name: 'Cancel',
    });
    this.saveButton = this.page.getByRole('button', {
      name: 'Save',
    });
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

  async validateProgramFsps({ fspNames }: { fspNames: string[] }) {
    const list = this.page.getByTestId('integrated-fsp-list');
    const fsps = list.getByRole('listitem');
    const fspsCount = await fsps.count();

    expect(fspsCount).toBe(fspNames.length);

    for (const fsp of fspNames) {
      await expect(list).toContainText(fsp);
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
      await expect(this.languageTabs.nth(index)).toContainText(language);
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

  async validateMissingFields({ missingFields }: { missingFields: string[] }) {
    for (const field of missingFields) {
      const missingFieldTag = this.page.getByTestId(
        'kobo-integration-missing-field-' + field,
      );
      await expect(missingFieldTag).toBeVisible();
      await expect(missingFieldTag).toHaveText(field);
    }
  }

  async validateFormSettingError({
    formSettingError,
  }: {
    formSettingError: string;
  }) {
    const formSettingErrorsList = this.page.getByTestId(
      'kobo-integration-form-setting-errors',
    );
    await expect(formSettingErrorsList).toContainText(formSettingError);
  }

  async validateKoboConfigurationErrorsTable({
    configurationErrorsTableColumns,
    configurationErrors,
  }: {
    configurationErrorsTableColumns: string[];
    configurationErrors: string[];
  }) {
    const configurationErrorsTable = this.page
      .getByTestId('kobo-integration-configuration-errors-table')
      .locator('table');
    const columnHeaders = await configurationErrorsTable
      .locator('th')
      .allInnerTexts();
    const rows = await configurationErrorsTable.locator('td').allInnerTexts();

    await expect(columnHeaders).toEqual(configurationErrorsTableColumns);
    await expect(rows.map((row) => row.trim())).toEqual(configurationErrors);
  }

  async validateErrorDialogIsShown() {
    const koboIntegrationDialog = new DialogComponent(
      this.page.getByTestId('kobo-error-dialog').locator('.p-dialog'),
    );
    await koboIntegrationDialog.waitForVisible();
  }

  async validateEditButton({ visible }: { visible: boolean }) {
    if (visible) {
      await expect(this.editLabelsButton).toBeVisible();
    } else {
      await expect(this.editLabelsButton).toBeHidden();
    }
  }

  async validateCancelButton({ visible }: { visible: boolean }) {
    if (visible) {
      await expect(this.cancelButton).toBeVisible();
    } else {
      await expect(this.cancelButton).toBeHidden();
    }
  }

  async validateSaveButton({ visible }: { visible: boolean }) {
    if (visible) {
      await expect(this.saveButton).toBeVisible();
    } else {
      await expect(this.saveButton).toBeHidden();
    }
  }

  async editLabels({
    labelUpdates,
  }: {
    labelUpdates: { name: string; label: string }[];
  }) {
    await this.editLabelsButton.click();
    await this.validateEditButton({ visible: false });
    await this.validateCancelButton({ visible: true });
    await this.validateSaveButton({ visible: true });

    for (const update of labelUpdates) {
      const input = this.page.getByTestId(
        `attribute-label-input-en-${update.name}`,
      );
      await input.fill(update.label);
    }

    await this.saveButton.click();

    await this.validateEditButton({ visible: true });
    await this.validateCancelButton({ visible: false });
    await this.validateSaveButton({ visible: false });
  }

  async validateUpdatedAtValue(updatedAt: string) {
    const lastUpdatedTime = this.page.getByTestId(
      'kobo-integration-last-updated',
    );
    await expect(lastUpdatedTime).toHaveText(updatedAt);
  }
}

export default RegistrationDataPage;
