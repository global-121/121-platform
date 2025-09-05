import { Locator, Page } from 'playwright';

import BasePage from '@121-e2e/portal/pages/BasePage';

class ExportData extends BasePage {
  readonly page: Page;
  readonly proceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.proceedButton = this.page.getByRole('button', { name: 'Proceed' });
  }

  async clickProceedToExport() {
    await this.proceedButton.click();
  }

  async exportAndAssertData({
    minRowCount,
    exactRowCount,
    excludedColumns,
    orderOfDataIsImportant,
    format = 'xlsx',
    snapshotName,
    sortFunction,
  }: {
    minRowCount?: number;
    exactRowCount?: number;
    excludedColumns?: string[];
    orderOfDataIsImportant?: boolean;
    format?: 'xlsx' | 'csv';
    snapshotName?: string;
    sortFunction?: (a: string[], b: string[], headerCells: string[]) => number;
  } = {}) {
    if (format === 'csv') {
      await this.page.getByLabel('CSV').click();
    }

    const filePath = await this.downloadFile(this.clickProceedToExport());
    await this.validateExportedFile({
      filePath,
      minRowCount,
      expectedRowCount: exactRowCount,
      format,
      excludedColumns,
      orderOfDataIsImportant,
      snapshotName,
      sortFunction,
    });

    await this.dismissToastIfVisible();
  }
}

export default ExportData;
