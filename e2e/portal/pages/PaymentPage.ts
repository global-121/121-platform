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
  readonly formDialogProceedButton: Locator;
  readonly viewPaymentTitle: Locator;
  readonly paymentAmount: Locator;
  readonly retryFailedTransactionsButton: Locator;
  readonly firstDialogRetryTransactionButton: Locator;
  readonly secondDialogProceedButton: Locator;
  readonly exportButton: Locator;
  readonly paymentLogTab: Locator;
  readonly paymentLogTable: Locator;
  readonly startPaymentButton: Locator;
  readonly approvePaymentButton: Locator;

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
    this.formDialogProceedButton = this.page.getByTestId(
      'form-dialog-proceed-button',
    );
    this.viewPaymentTitle = this.page.getByRole('heading', {
      name: /Payment \d{2}\/\d{2}\/\d{4}/,
    });
    this.paymentAmount = this.page.getByTestId('metric-tile-component');
    this.retryFailedTransactionsButton = this.page.getByRole('button', {
      name: 'Retry failed transaction(s)',
    });
    this.firstDialogRetryTransactionButton = this.page.getByRole('button', {
      name: 'Retry transactions',
    });
    this.secondDialogProceedButton = this.page.getByRole('button', {
      name: 'Proceed',
    });
    this.exportButton = this.page.getByRole('button', {
      name: 'Export',
    });
    this.paymentLogTab = this.page.getByRole('tab', { name: 'Payment log' });
    this.paymentLogTable = this.page.getByTestId('payment-log-table');
    this.startPaymentButton = this.page.getByRole('button', {
      name: 'Start payment',
    });
    this.approvePaymentButton = this.page.getByRole('button', {
      name: 'Approve payment',
    });
  }

  async approveAndStartPayment({
    validateToast = true,
  }: {
    validateToast?: boolean;
  }) {
    await this.approvePayment();
    if (validateToast) {
      await this.validateToastMessageAndClose('Payment approved successfully.');
    }
    await this.startPayment();
    if (validateToast) {
      await this.validateToastMessageAndClose('Payment started successfully.');
    }
  }

  async approvePayment() {
    await this.approvePaymentButton.click();
    await this.formDialogProceedButton.click();
  }

  async startPayment() {
    await this.startPaymentButton.click();
    await this.formDialogProceedButton.click();
  }

  async validateButtonVisibility({
    isVisible,
    button,
  }: {
    isVisible: boolean;
    button: 'approve' | 'start';
  }) {
    if (isVisible) {
      if (button === 'start') {
        await expect(this.startPaymentButton).toBeVisible();
      } else {
        await expect(this.approvePaymentButton).toBeVisible();
      }
    } else {
      if (button === 'start') {
        await expect(this.startPaymentButton).toBeHidden();
      } else {
        await expect(this.approvePaymentButton).toBeHidden();
      }
    }
  }

  async waitForPaymentToComplete() {
    await this.page.waitForTimeout(500); // TODO for now needed to bridge in-progress gap between actions & queue.
    const approvedChip = this.page
      .locator('app-colored-chip')
      .getByLabel('Approved')
      .first();
    const inProgressChip = this.page
      .locator('app-colored-chip')
      .getByLabel('In progress');

    await inProgressChip.waitFor({ state: 'hidden' });
    await approvedChip.waitFor({ state: 'visible' });
  }

  async validateBadgeIsPresentByLabel({
    badgeName,
    isVisible,
    count,
  }: {
    badgeName: string;
    isVisible: boolean;
    count?: number;
  }) {
    const badge = this.page.locator('app-colored-chip').getByLabel(badgeName);
    const allBadges = await badge.all();
    const badgeCount = allBadges.length;

    if (isVisible) {
      for (const badgeElement of allBadges) {
        await expect(badgeElement).toBeVisible();
      }
      expect(badgeCount).toBe(count);
    } else {
      await expect(badge).toBeHidden();
    }
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
    approved,
    processing,
    successful,
    failed,
  }: {
    approved: number;
    processing: number;
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
        `Approved: ${approved}, Processing: ${processing}, Successful: ${successful}, Failed: ${failed}`,
      );
    } else {
      throw new Error('Graph attribute is null');
    }
  }

  async validateTransferValues({ amount }: { amount: number }) {
    await this.page.waitForTimeout(1000); // Wait for the graph to be updated after the loader is hidden

    const paymentAmount = this.paymentAmount.getByText('€');
    const paymentAmountText = await paymentAmount.textContent();
    const normalizedPaymentAmountText = paymentAmountText?.replace(/,/g, '');

    expect(normalizedPaymentAmountText).toContain(amount.toString());
  }

  async validateRetryFailedTransactionsButtonToBeVisible() {
    await expect(this.retryFailedTransactionsButton).toBeVisible({
      timeout: 5000,
    });
  }

  async validateRetryFailedTransactionsButtonToBeHidden() {
    await expect(this.retryFailedTransactionsButton).toBeHidden();
  }

  async retryFailedTransactions({
    totalTransactions,
    failedTransactions,
    filterFirst,
  }: {
    totalTransactions: number;
    failedTransactions: number;
    filterFirst: boolean;
  }) {
    if (filterFirst) {
      await this.table.filterColumnByDropDownSelection({
        columnName: 'Transaction status',
        selection: 'Failed',
      });
    }

    const expectedApplicableCount = failedTransactions;
    const expectedNonApplicableCount = filterFirst
      ? 0
      : totalTransactions - failedTransactions;
    const expectedSelectedTransactions =
      failedTransactions + expectedNonApplicableCount;

    await this.table.selectAll();

    await this.retryFailedTransactionsButton.click();

    // Check for the sentence in the first popup
    const expectedFirstDialogText = this.page.getByText(
      `You are about to retry ${expectedSelectedTransactions} transaction(s). The transaction status will change to 'Processing' until received by the registration.`,
    );
    await expect(expectedFirstDialogText).toBeVisible();

    await this.firstDialogRetryTransactionButton.click();

    if (expectedNonApplicableCount === 0) {
      return;
    }

    // Check for the first sentence if you expect it to be present
    const expectedSecondDialogFirstSentence = this.page.getByText(
      `There are ${expectedNonApplicableCount} selected transaction(s) that are not on status 'Failed' and will not be retried.`,
    );

    await expect(expectedSecondDialogFirstSentence).toBeVisible();

    // Check the applicableCount in the second sentence
    await expect(
      this.page.getByText(
        new RegExp(
          `You are about to retry ${expectedApplicableCount} transaction\\(s\\)`,
        ),
      ),
    ).toBeVisible();

    await this.secondDialogProceedButton.click();
  }

  async importReconciliationData(filePath: string) {
    await this.importReconciliationDataButton.click();

    await this.chooseAndUploadFile(filePath);

    await this.importFileButton.click();
  }

  async navigateToPaymentLog(): Promise<void> {
    await this.paymentLogTab.click();
    await this.page.waitForURL('**/payment-log');
  }

  async validatePaymentLogEntries(expectedNote: string): Promise<void> {
    const rows = this.paymentLogTable.locator('tbody tr');
    await expect(rows).toHaveCount(4);

    const noteRow = rows.filter({ hasText: expectedNote });
    const createdRow = rows.filter({ hasText: 'Created' });
    const approvedRow = rows.filter({ hasText: 'Approved' });
    const startedRow = rows.filter({ hasText: 'Started' });

    await expect(noteRow).toBeVisible();
    await expect(createdRow).toBeVisible();
    await expect(approvedRow).toBeVisible();
    await expect(startedRow).toBeVisible();
  }

  async validatePaymentLog(expectedNote: string): Promise<void> {
    await this.navigateToPaymentLog();
    await this.validatePaymentLogEntries(expectedNote);
  }
}

export default PaymentPage;
