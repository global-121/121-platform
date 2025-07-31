import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';

class PaymentPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly importReconciliationDataButton: Locator;
  readonly chooseFileButton: Locator;
  readonly importFileButton: Locator;
  readonly proceedButton: Locator;
  readonly viewPaymentTitle: Locator;
  readonly paymentAmount: Locator;
  readonly retryFailedTransfersButton: Locator;
  readonly popupRetryTransferButton: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.importReconciliationDataButton = this.page.getByRole('button', {
      name: 'Import reconciliation data',
    });
    this.chooseFileButton = this.page.getByRole('button', {
      name: 'Choose file',
    });
    this.importFileButton = this.page.getByRole('button', {
      name: 'Import file',
    });
    this.proceedButton = this.page.getByRole('button', { name: 'Proceed' });
    this.viewPaymentTitle = this.page.getByRole('heading', {
      name: 'Payment',
    });
    this.paymentAmount = this.page.getByTestId('metric-tile-component');
    this.retryFailedTransfersButton = this.page.getByRole('button', {
      name: 'Retry failed transfer(s)',
    });
    this.popupRetryTransferButton = this.page.getByRole('button', {
      name: 'Retry transfers',
    });
    this.exportButton = this.page.getByRole('button', {
      name: 'Export',
    });
  }

  async waitForPaymentToComplete() {
    const inProgressChip = this.page
      .locator('app-colored-chip')
      .getByLabel('In progress');

    await inProgressChip.waitFor({ state: 'hidden' });
  }

  async validateInProgressChipIsPresent() {
    const inProgressChip = this.page
      .locator('app-colored-chip')
      .getByLabel('In progress');

    await expect(inProgressChip).toBeVisible();
  }

  async validatePaymentsDetailsPageByDate(date: string) {
    const viewPaymentTitle = await this.viewPaymentTitle.textContent();
    expect(viewPaymentTitle).toContain(date);
  }

  async selectPaymentExportOption({ option }: { option: string }) {
    await this.page.waitForLoadState('networkidle');
    await this.exportButton.click();
    await this.page.getByRole('menuitem', { name: option }).click();
  }

  async validateGraphStatus({
    pending,
    successful,
    failed,
  }: {
    pending: number;
    successful: number;
    failed: number;
  }) {
    await this.page.waitForTimeout(1000); // Wait for the graph to be updated after the loader is hidden
    const graph = await this.page.locator('canvas').getAttribute('aria-label');
    if (graph) {
      const graphText = graph
        .replace('Payment status chart.', '')
        .replace(/\s+/g, ' ')
        .trim();

      expect(graphText).toContain(
        `Pending: ${pending}, Successful: ${successful}, Failed: ${failed}`,
      );
    } else {
      throw new Error('Graph attribute is null');
    }
  }

  async validateTransferAmounts({ amount }: { amount: number }) {
    await this.page.waitForTimeout(1000); // Wait for the graph to be updated after the loader is hidden

    const paymentAmount = this.paymentAmount.getByText('€');
    const paymentAmountText = await paymentAmount.textContent();
    const normalizedPaymentAmountText = paymentAmountText?.replace(/,/g, '');

    expect(normalizedPaymentAmountText).toContain(amount.toString());
  }

  async validateRetryFailedTransfersButtonToBeVisible() {
    await expect(this.retryFailedTransfersButton).toBeVisible();
  }

  async validateRetryFailedTransfersButtonToBeHidden() {
    await expect(this.retryFailedTransfersButton).toBeHidden();
  }

  async retryFailedTransfers() {
    await this.table.filterColumnByDropDownSelection({
      columnName: 'Transfer status',
      selection: 'Failed',
    });

    await this.table.selectAll();

    await this.retryFailedTransfersButton.click();

    await this.popupRetryTransferButton.click();
  }

  async importReconciliationData(filePath: string) {
    await this.importReconciliationDataButton.click();

    await this.chooseAndUploadFile(filePath);

    await this.importFileButton.click();
  }
}

export default PaymentPage;
