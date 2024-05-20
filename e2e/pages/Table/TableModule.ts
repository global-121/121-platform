import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

interface PersonLeft {
  personAffected?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  status?: string;
}
interface PersonRight {
  preferredLanguage?: string;
}

class TableModule {
  readonly page: Page;
  readonly filterInput: Locator;
  readonly button: Locator;
  readonly textLabel: Locator;
  readonly bulkActionsDropdown: Locator;
  readonly informationPopUpButton: Locator;
  readonly paCell: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filterInput = this.page.locator('input[type="text"]');
    this.button = this.page.locator('ion-button');
    this.textLabel = this.page.locator('ion-text');
    this.bulkActionsDropdown = this.page.locator('select[name="bulkActions"]');
    this.informationPopUpButton = this.page.getByTestId(
      'information-popup-button',
    );
    this.paCell = this.page.getByTestId('pa-table-cell');
  }

  static getRow(rowIndex: number) {
    return `//datatable-row-wrapper[${rowIndex}]`;
  }
  static getTable(tableIndex: number) {
    return `/datatable-body-row/div[${tableIndex}]/`;
  }
  static getCollumn(collumnIndex: number) {
    return `datatable-body-cell[${collumnIndex}]`;
  }
  static getCellValueTableLeft(row: number, collumn: number) {
    return (
      TableModule.getRow(row) +
      TableModule.getTable(1) +
      TableModule.getCollumn(collumn)
    );
  }
  static getCellValueTableRight(row: number, collumn: number) {
    return (
      TableModule.getRow(row) +
      TableModule.getTable(2) +
      TableModule.getCollumn(collumn)
    );
  }

  async waitForElementDisplayed(selector: string) {
    await this.page.waitForLoadState('networkidle');
    await this.page.locator(selector).waitFor({ state: 'visible' });
  }

  async getElementText(locator: string) {
    return await this.page.locator(locator).textContent();
  }

  async waitForElementToContainText(selector: string, text: string) {
    await this.waitForElementDisplayed(selector);
    let i = 0;
    let content = '';
    while (!content.includes(text) && i < 10) {
      await this.page.waitForTimeout(500);
      const elementText = await this.getElementText(selector);
      content = elementText !== null ? elementText : '';
      i++;
    }
    if (content.includes(text)) {
      console.log(`Element with text "${content}" was displayed`);
      return;
    } else {
      throw new Error(
        `Element ${selector} did not contain text "${text}", instead it contained "${content}"`,
      );
    }
  }

  async verifiyProfilePersonalnformationTableLeft(
    rowIndex: number,
    person: PersonLeft,
  ) {
    const { personAffected, firstName, lastName, phoneNumber, status } = person;

    if (personAffected !== undefined) {
      await this.waitForElementToContainText(
        TableModule.getCellValueTableLeft(rowIndex, 2),
        personAffected,
      );
    }
    if (firstName !== undefined) {
      await this.waitForElementToContainText(
        TableModule.getCellValueTableLeft(rowIndex, 3),
        firstName,
      );
    }
    if (lastName !== undefined) {
      await this.waitForElementToContainText(
        TableModule.getCellValueTableLeft(rowIndex, 4),
        lastName,
      );
    }
    if (phoneNumber !== undefined) {
      await this.waitForElementToContainText(
        TableModule.getCellValueTableLeft(rowIndex, 5),
        phoneNumber,
      );
    }
    if (status !== undefined) {
      await this.waitForElementToContainText(
        TableModule.getCellValueTableLeft(rowIndex, 6),
        status,
      );
    }
  }

  async verifiyProfilePersonalnformationTableRight(
    rowIndex: number,
    person: PersonRight,
  ) {
    const { preferredLanguage } = person;

    if (preferredLanguage !== undefined) {
      await this.waitForElementToContainText(
        TableModule.getCellValueTableRight(rowIndex, 1),
        preferredLanguage,
      );
    }
  }

  async clickOnPaNumber(rowIndex: number) {
    await this.page
      .locator(TableModule.getCellValueTableLeft(rowIndex, 2))
      .click();
  }

  async selectTable(tableName: string) {
    await this.button.filter({ hasText: tableName }).click();
  }

  async quickFilter(filter: string) {
    try {
      await this.filterInput.waitFor({ state: 'visible' });
      await this.filterInput.fill(filter);

      const applyFilterButtonLocator = this.button.filter({
        hasText: 'Apply Filter',
      });
      await applyFilterButtonLocator.waitFor({ state: 'visible' });
      await applyFilterButtonLocator.click();
    } catch (error) {
      console.error(`Failed to apply quick filter: ${error}`);
    }
  }

  async validateQuickFilterResultsNumber(expectedNumber: number) {
    const textLocator = this.textLabel.filter({
      hasText: 'Filtered recipients:',
    });
    const textContent = await textLocator.textContent();

    if (textContent !== null) {
      const expectedText = `Filtered recipients: ${expectedNumber}`;
      if (textContent.trim() !== expectedText) {
        throw new Error(
          `Expected "${expectedText}" but received "${textContent.trim()}"`,
        );
      }
    } else {
      console.error('Text content is null');
    }
  }

  async applyBulkAction(option: string) {
    await this.page.reload();
    await this.page.waitForTimeout(1000);
    await this.bulkActionsDropdown.selectOption(option);
    await this.page.getByLabel('Select', { exact: true }).click();
    await this.button.filter({ hasText: 'Apply action' }).click();
  }

  async validateBulkActionTargetedPasNumber(expectedNumber: number) {
    const textLocator = this.page
      .locator('p')
      .filter({ hasText: 'Send Message to PAs' });
    const textContent = await textLocator.textContent();

    if (textContent !== null) {
      const expectedText = `Send Message to PAs for ${expectedNumber} People Affected.`;
      if (textContent.trim() !== expectedText) {
        throw new Error(
          `Expected "${expectedText}" but received "${textContent.trim()}"`,
        );
      }
    } else {
      console.error('Text content is null');
    }
  }

  async selectFieldsforCustomMessage({
    selectFieldDropdownName,
    firstNameOption,
    addPersonalizedFieldName,
    okButtonName,
  }: {
    selectFieldDropdownName: string;
    firstNameOption: string;
    addPersonalizedFieldName: string;
    okButtonName: string;
  }) {
    const okButton = this.page.getByRole('button', {
      name: okButtonName,
    });
    await this.page
      .getByTitle(selectFieldDropdownName)
      .getByLabel(selectFieldDropdownName)
      .click();
    await this.page.getByRole('radio', { name: firstNameOption }).click();
    await this.page
      .getByRole('button', { name: addPersonalizedFieldName })
      .click();

    await okButton.waitFor({ state: 'visible' });
    await okButton.click();

    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
  }

  async validateInformationButtonsPresent() {
    await this.page.waitForLoadState('networkidle');
    const actualCount = await this.informationPopUpButton.count();
    const expectedCount = await this.paCell.count();

    if (actualCount !== expectedCount) {
      throw new Error(
        `Expected ${actualCount} elements, but found ${expectedCount}`,
      );
    }
  }

  async validateNoInformationButtonIsPresent() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.informationPopUpButton).toBeHidden();
  }
}

export default TableModule;
