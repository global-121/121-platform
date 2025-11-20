import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';

import { PrimeNGDatePicker } from '../components/PrimeNGDatePicker';

class PaymentsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly createNewPaymentButton: Locator;
  readonly addToPaymentButton: Locator;
  readonly fspSummary: Locator;
  readonly createPaymentButton: Locator;
  readonly paymentTitle: Locator;
  readonly paymentSummaryMetrics: Locator;
  readonly paymentSummaryWithInstructions: Locator;
  readonly exportButton: Locator;
  readonly dateRangeStartInput: PrimeNGDatePicker;
  readonly dateRangeEndInput: PrimeNGDatePicker;
  readonly noteInput: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.createNewPaymentButton = this.page.getByRole('button', {
      name: 'Create new payment',
    });
    this.addToPaymentButton = this.page.getByRole('button', {
      name: 'Add to payment',
    });
    this.createPaymentButton = this.page.getByRole('button', {
      name: 'Create payment',
    });
    this.fspSummary = this.page
      .locator('p-card')
      .filter({ hasText: 'Financial Service Provider(s' });
    this.paymentTitle = this.page.getByRole('link', { name: 'Payment' });
    this.paymentSummaryMetrics = this.page
      .getByTestId('payment-summary-metrics')
      .locator('app-metric-container');
    this.paymentSummaryWithInstructions = this.page.getByTestId(
      'create-payment-fsp-instructions',
    );
    this.exportButton = this.page.getByRole('button', {
      name: 'Export',
    });
    this.dateRangeStartInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByRole('combobox', {
        name: 'Start Date',
      }),
    });
    this.dateRangeEndInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByRole('combobox', {
        name: 'End Date',
      }),
    });
    this.noteInput = this.page.locator('input[formControlName="note"]');
  }

  async selectAllRegistrations() {
    await this.table.selectAll();
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

  async createPayment({
    note,
    onlyStep1 = false,
  }: {
    note?: string;
    onlyStep1?: boolean;
  }) {
    await this.createNewPaymentButton.click();
    await this.selectAllRegistrations();
    await this.addToPaymentButton.click();
    if (onlyStep1) {
      return;
    }
    if (note) {
      await this.addPaymentNote(note);
    }
    await this.createPaymentButton.click();
  }

  async addPaymentNote(note: string) {
    await this.noteInput.fill(note);
  }

  async validateInProgressBannerIsPresent() {
    const inProgressBanner = this.page.getByTestId(
      'payment-in-progress-banner',
    );

    await expect(inProgressBanner).toBeVisible();
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
    programId,
    paymentId = 1,
  }: {
    date: string;
    registrationsNumber: number;
    paymentAmount: number;
    successfulTransfers: number;
    failedTransfers: number;
    currency?: string;
    programId: number;
    paymentId?: number;
  }) {
    // Locate the specific payment card using the payment link and then navigate to its ancestor card element
    const hrefLocatorUrl = `"/en-GB/program/${programId}/payments/${paymentId}"`;
    const cardTitleLocator = this.page.locator(`a[href=${hrefLocatorUrl}]`);
    const paymentTitle = await cardTitleLocator.getByTitle(date).textContent();
    // console.log('pageLocator: ', await pageLocator.textContent());

    // const child = page.getByText('Hello');
    // const parent = page.getByRole('listitem').filter({ has: child });
    // const cardLocator2 = this.page.locator(`[data-pc-name="card"]`).filter({
    //   has: pageLocator,
    // });
    // console.log('cardLocator2: ', await cardLocator2.textContent());

    // const cardLocator = pageLocator.locator(
    //   'xpath=ancestor::*[@data-pc-name="card"]',
    // );
    // console.log('cardLocator: ', await cardLocator.textContent());
    // const paymentSummaryMetricsLocator = cardLocator.getByTestId(
    //   'payment-summary-metrics',
    // );
    // console.log(
    //   'paymentSummaryMetricsLocator: ',
    //   await paymentSummaryMetricsLocator.textContent(),
    // );
    // const paymentSummaryMetrics = paymentSummaryMetricsLocator.locator(
    //   'app-metric-container',
    // );
    // console.log(
    //   'paymentSummaryMetrics: ',
    //   await paymentSummaryMetrics
    //     .filter({ hasText: 'Included reg.' })
    //     .textContent(),
    // );
    // paymentSummaryMetrics:   Included reg.  1
    const card = this.page
      .locator('[data-pc-name="card"]')
      .filter({ has: cardTitleLocator })
      .getByTestId('payment-summary-metrics')
      .locator('app-metric-container');

    const includedRegistrationsElement = await card
      .filter({ hasText: 'Included reg.' })
      .textContent();

    // Get the total amount element within the card
    const totalAmountElement = await card
      .filter({ hasText: 'Expected total amount' })
      .textContent();

    const successfulTransfersElement = await card
      .filter({ hasText: 'Amount successfully sent' })
      .textContent();

    const failedTransfersElement = await card
      .filter({ hasText: 'Failed transactions' })
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
      Review payment summary and follow the next steps: Click create payment, this will direct you to the payment page.
      When you want the payment to start, click approve and start payment or instruct the designated user to do so.
      Export the FSP instructions and save the exported XLSX-file in the format required by the Financial Service Provider.
      Upload the file to the Financial Service Provider’s portal.
    `
      .replace(/\s+/g, ' ')
      .trim();

    const actualText = paymentSummaryWithInstructions
      .replace(/\s+/g, ' ')
      .replace(/Financial Service Provider\(s\):.*/g, '')
      .trim();

    expect(actualText).toBe(expectedText);
  }

  async selectPaymentExportOption({
    option,
    dateRange,
  }: {
    option: string;
    dateRange?: { start: Date; end: Date };
  }) {
    await this.page.waitForLoadState('networkidle');
    await this.exportButton.click();
    await this.page.getByRole('menuitem', { name: option }).click();
    if (dateRange) {
      await this.dateRangeStartInput.selectDate({
        targetDate: dateRange.start,
      });
      await this.dateRangeEndInput.selectDate({ targetDate: dateRange.end });
    }
  }

  async navigateToDateInPicker(input: Locator, targetDate: Date) {
    await input.click();

    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    while (currentMonth !== targetMonth || currentYear !== targetYear) {
      if (
        currentYear < targetYear ||
        (currentYear === targetYear && currentMonth < targetMonth)
      ) {
        await this.page.locator('.p-datepicker-next-button').click();
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      } else {
        await this.page.locator('.p-datepicker-prev-button').click();
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
      }
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth()); // Month is 0-indexed
    const day = String(targetDate.getDate());
    const formattedDate = `${year}-${month}-${day}`;
    // TODO: use DatePicker-components API instead (see https://github.com/global-121/121-platform/pull/7175#discussion_r2313515442)
    await this.page.locator(`[data-date="${formattedDate}"]`).click();
  }

  async validateExportMessage({ message }: { message: string }) {
    const exportMessage = this.page.getByText(message);
    await expect(exportMessage).toBeVisible();
  }

  async isPaymentPageEmpty(): Promise<boolean> {
    await this.page
      .getByText('No Payments found', { exact: true })
      .waitFor({ state: 'attached' });
    await this.page
      .getByText('There are no payments for this program yet.', { exact: true })
      .waitFor({ state: 'attached' });

    const noPaymentsFoundVisible = await this.page
      .getByText('No Payments found', { exact: true })
      .isVisible();

    // Check if the "There are no payments for this program yet." message is visible
    const noPaymentsForProgramVisible = await this.page
      .getByText('There are no payments for this program yet.', { exact: true })
      .isVisible();

    return noPaymentsFoundVisible && noPaymentsForProgramVisible;
  }
}

export default PaymentsPage;
