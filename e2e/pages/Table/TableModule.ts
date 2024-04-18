import { Page } from 'playwright';

interface PersonLeft {
  personAffected: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
};
interface PersonRight {
  preferredLanguage: string;
};

class TableModule {
  page: Page;
  static getRow(rowIndex: number) {
    return `//datatable-row-wrapper[${rowIndex}]`;
  };
  static getTable(tableIndex: number) {
    return `/datatable-body-row/div[${tableIndex}]/`;
  };
  static getCollumn(collumnIndex: number) {
    return `datatable-body-cell[${collumnIndex}]`;
  };
  static getCellValueTableLeft(row: number, collumn: number) {
    return (TableModule.getRow(row)+TableModule.getTable(1)+TableModule.getCollumn(collumn));
  };
  static getCellValueTableRight(row: number, collumn: number) {
    return (TableModule.getRow(row)+TableModule.getTable(2)+TableModule.getCollumn(collumn));
  };

  constructor(page: Page) {
    this.page = page;
  };

  async waitForElementDisplayed(selector: string) {
    await this.page.waitForLoadState('networkidle');
    await this.page.locator(selector).waitFor({ state: 'visible' });
  };

  async getElementText(locator: string) {
    return await this.page.locator(locator).textContent();
  };

  async waitForElementToContainText(selector: string, text: string) {
    await this.waitForElementDisplayed(selector);
    let i = 0;
    let content = '';
    while (!content.includes(text) && i < 10) {
      await this.page.waitForTimeout(500);
      let elementText = await this.getElementText(selector);
      content = elementText !== null ? elementText : '';
      i++;
    }
    if (content.includes(text)) {
      console.log(`Element with text "${content}" was displayed`)
      return;
    }
    else {
      throw new Error(`Element ${selector} did not contain text "${text}", instead it contained "${content}"`)
    }
  };

  async verifyRowTableLeft(rowIndex: number, person: PersonLeft) {
    const { personAffected, firstName, lastName, phoneNumber, status } = person;

    if (personAffected !== undefined) {
      await this.waitForElementToContainText(TableModule.getCellValueTableLeft(rowIndex, 2), personAffected);
    }
    if (firstName !== undefined) {
      await this.waitForElementToContainText(TableModule.getCellValueTableLeft(rowIndex, 3), firstName);
    }
    if (lastName !== undefined) {
      await this.waitForElementToContainText(TableModule.getCellValueTableLeft(rowIndex, 4), lastName);
    }
    if (phoneNumber !== undefined) {
      await this.waitForElementToContainText(TableModule.getCellValueTableLeft(rowIndex, 5), phoneNumber);
    }
    if (status !== undefined) {
      await this.waitForElementToContainText(TableModule.getCellValueTableLeft(rowIndex, 6), status);
    }
  };

  async verifyRowTableRight(rowIndex: number, person: PersonRight) {
    const { preferredLanguage } = person;

    if (preferredLanguage !== undefined) {
      await this.waitForElementToContainText(TableModule.getCellValueTableRight(rowIndex, 1), preferredLanguage);
    }
  };

  async clickOnPaNumber(rowIndex: number) {
    await this.page.locator(TableModule.getCellValueTableLeft(rowIndex, 2)).click();
  };
};

export default TableModule;