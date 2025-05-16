import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';

class PaymentsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly createPaymentButton: Locator;
  readonly addToPaymentButton: Locator;
  readonly fspSummary: Locator;
  readonly startPaymentButton: Locator;
  readonly paymentTitle: Locator;
  readonly paymentSummaryMetrics: Locator;
  readonly paymentSummaryWithInstructions: Locator;
  readonly exportFspPaymentListButton: Locator;
  readonly exportButton: Locator;
  readonly importReconcilationDataButton: Locator;
  readonly chooseFileButton: Locator;
  readonly importFileButton: Locator;
  readonly proceedButton: Locator;
  readonly viewPaymentTitle: Locator;
  readonly paymentAmount: Locator;
  readonly retryFailedTransfersButton: Locator;
  readonly popupRetryTransferButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.createPaymentButton = this.page.getByRole('button', {
      name: 'Create new payment',
    });
    this.addToPaymentButton = this.page.getByRole('button', {
      name: 'Add to payment',
    });
    this.startPaymentButton = this.page.getByRole('button', { name: 'Start' });
    this.fspSummary = this.page
      .locator('p-card')
      .filter({ hasText: 'Financial Service Provider(s' });
    this.paymentTitle = this.page.getByRole('link', { name: 'Payment' });
    this.paymentSummaryMetrics = this.page
      .getByTestId('payment-summary-metrics')
      .locator('app-metric-container');
    this.paymentSummaryWithInstructions = this.page.getByTestId(
      'create-payment-excel-fsp-instructions',
    );
    this.exportFspPaymentListButton = this.page.getByLabel(
      'Export FSP payment list',
    );
    this.exportButton = this.page.getByRole('button', {
      name: 'Export',
    });
    this.importReconcilationDataButton = this.page.getByRole('button', {
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
  }

  async selectAllRegistrations() {
    await this.table.selectAllCheckbox();
  }

  async validatePaymentSummary({
    fsp,
    registrationsNumber,
    currency,
    paymentAmount,
  }: {
    fsp: string[];
    registrationsNumber: number;
    currency: string;
    paymentAmount: number;
  }) {
    const fspSummary = await this.fspSummary.textContent();

    expect(fspSummary).toContain(
      `Financial Service Provider(s): ${fsp.join(', ')}`,
    );
    expect(fspSummary).toContain(`Registrations: ${registrationsNumber}`);
    expect(fspSummary).toContain(
      `Total payment amount: ${currency}${paymentAmount}`,
    );
  }

  async createPayment() {
    await this.createPaymentButton.click();
    await this.selectAllRegistrations();
    await this.addToPaymentButton.click();
  }

  async startPayment() {
    await this.startPaymentButton.click();
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

  async validateNumericValue(
    elementText: string | null,
    expectedValue: number,
  ) {
    if (!elementText) throw new Error('Element text is null');
    const extractedValue = elementText.replace(/[^0-9.]/g, '');
    const actualNumber = parseFloat(extractedValue);
    expect(actualNumber).toBeCloseTo(expectedValue, 2);
  }

  async validatePaymentCard({
    date,
    registrationsNumber,
    paymentAmount,
    successfulTransfers,
    failedTransfers,
    currency = '€',
  }: {
    date: string;
    registrationsNumber: number;
    paymentAmount: number;
    successfulTransfers: number;
    failedTransfers: number;
    currency?: string;
  }) {
    const paymentTitle = await this.paymentTitle.textContent();
    const includedRegistrationsElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Included reg.' })
      .textContent();
    const totalAmountElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Expected total amount' })
      .textContent();
    const successfulTransfersElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Amount successfully sent' })
      .textContent();
    const failedTransfersElement = await this.paymentSummaryMetrics
      .filter({ hasText: 'Failed transfers' })
      .textContent();
    // Validate payment title
    expect(paymentTitle).toContain(date);
    // Validate included registrations
    expect(includedRegistrationsElement).toContain(
      registrationsNumber.toString(),
    );
    // Validate payment amount and currency
    await this.validateNumericValue(totalAmountElement, paymentAmount);
    expect(totalAmountElement).toContain(currency);
    // Validate successful transfers
    await this.validateNumericValue(
      successfulTransfersElement,
      successfulTransfers,
    );
    // Validate failed transfers
    await this.validateNumericValue(failedTransfersElement, failedTransfers);
  }

  async openPaymentByDate({ date }: { date: string }) {
    const paymentTitle = this.page.getByText(date);
    await paymentTitle.click();
  }

  async validateExcelFspInstructions() {
    const paymentSummaryWithInstructions =
      await this.paymentSummaryWithInstructions.textContent();

    if (!paymentSummaryWithInstructions) {
      throw new Error('Payment summary with instructions is not available.');
    }

    const expectedText = `
      Review payment summary and follow the next steps: Click start payment, this will direct you to the payment page.
      Export the FSP instructions from the payment page. This is only possible once the payment is no longer in progress.
      Save the exported XLSX-file in the format required by the Financial Service Provider.
      Upload the file to the Financial Service Provider’s portal.
    `
      .replace(/\s+/g, ' ')
      .trim();

    const actualText = paymentSummaryWithInstructions
      .replace(/\s+/g, ' ')
      .replace(/Financial Service Provider\(s\):.*/g, '')
      .trim();

    if (actualText !== expectedText) {
      throw new Error(
        `Expected payment summary instructions to be:\n${expectedText}\n\nBut received:\n${actualText}`,
      );
    }
  }

  async selectPaymentExportOption({ option }: { option: string }) {
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

    await this.table.selectAllCheckbox();

    await this.retryFailedTransfersButton.click();

    await this.popupRetryTransferButton.click();
  }

  async importReconciliationData(filePath: string) {
    await this.importReconcilationDataButton.click();

    await this.chooseAndUploadFile(filePath);

    await this.importFileButton.click();
  }

  async exportFspPaymentList() {
    await this.exportButton.click();
    await this.exportFspPaymentListButton.click();
  }

  async isPaymentPageEmpty(): Promise<boolean> {
    await this.page
      .getByText('No Payments found', { exact: true })
      .waitFor({ state: 'attached' });
    await this.page
      .getByText('There are no payments for this project yet.', { exact: true })
      .waitFor({ state: 'attached' });

    const noPaymentsFoundVisible = await this.page
      .getByText('No Payments found', { exact: true })
      .isVisible();

    // Check if the "There are no payments for this project yet." message is visible
    const noPaymentsForProjectVisible = await this.page
      .getByText('There are no payments for this project yet.', { exact: true })
      .isVisible();

    return noPaymentsFoundVisible && noPaymentsForProjectVisible;
  }

  async exportAndAssertData({
    expectedRowCount,
    excludedColumns,
  }: {
    expectedRowCount: number;
    excludedColumns?: string[];
  }) {
    const filePath = await this.downloadFile(this.proceedButton.click());
    await this.validateExportedFile({
      filePath,
      expectedRowCount,
      format: 'xlsx',
      excludedColumns,
    });
  }
}

export default PaymentsPage;
