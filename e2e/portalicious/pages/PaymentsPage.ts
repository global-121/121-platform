import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import BasePage from '@121-e2e/portalicious/pages/BasePage';

class PaymentsPage extends BasePage {
  readonly page: Page;
  readonly table: TableComponent;
  readonly createPaymentButton: Locator;
  readonly addToPaymentButton: Locator;
  readonly fspSummary: Locator;
  readonly startPaymentButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.table = new TableComponent(page);
    this.createPaymentButton = this.page.getByRole('button', { name: 'Pay' });
    this.addToPaymentButton = this.page.getByRole('button', {
      name: 'Add to payment',
    });
    this.startPaymentButton = this.page.getByRole('button', { name: 'Start' });
    this.fspSummary = this.page
      .locator('p-card')
      .filter({ hasText: 'Financial Service Provider(s' });
  }

  async selectAllRegistrations() {
    await this.table.selectAllCheckbox();
  }

  async validatePaymentSummary({
    fsp,
    registrationsNumber,
    paymentAmount,
  }: {
    fsp: string[];
    registrationsNumber: number;
    paymentAmount: number;
  }) {
    const fspSummary = await this.fspSummary.textContent();

    expect(fspSummary).toContain(
      `Financial Service Provider(s): ${fsp.join(', ')}`,
    );
    expect(fspSummary).toContain(`Registrations: ${registrationsNumber}`);
    expect(fspSummary).toContain(`Total payment amount: €${paymentAmount}`);
  }

  async createPayment() {
    await this.createPaymentButton.click();
    await this.selectAllRegistrations();
    await this.addToPaymentButton.click();
  }

  async startPayment() {
    await this.startPaymentButton.click();
  }
}

export default PaymentsPage;
