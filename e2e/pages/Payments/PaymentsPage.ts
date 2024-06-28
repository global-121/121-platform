import TableModule from '@121-e2e/pages/Table/TableModule';
import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';
import englishTranslations from '../../../interfaces/Portal/src/assets/i18n/en.json';

const includedLabel =
  englishTranslations.page.program['program-payout']['make-payment'][
    'number-included'
  ];
const maxAmountLabel =
  englishTranslations.page.program['program-payout']['total-amount'];
const succesfullLabel =
  englishTranslations.page.program['program-payout']['result'].api;
const ok = englishTranslations.common.ok;
const startPayout =
  englishTranslations.page.program['program-payout']['start-payout'];

class PaymentsPage {
  readonly page: Page;
  readonly paymentPopupMakePaymentAmountInput: Locator;
  readonly paymentPopupMakePaymentButton: Locator;
  readonly paymentStatus: Locator;
  readonly paymentRetryButton: Locator;
  readonly paymentSuccessfulLabel: Locator;
  readonly paymentsFailedLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.paymentPopupMakePaymentAmountInput = this.page.getByTestId(
      'make-payment-amount',
    );
    this.paymentPopupMakePaymentButton = this.page.getByRole('button', {
      name: startPayout,
    });
    this.paymentStatus = this.page.getByTestId('program-payout-in-progress');
    this.paymentRetryButton = this.page.getByTestId(
      'program-payout-retry-last-payment',
    );
    this.paymentSuccessfulLabel = this.page.getByTestId(
      'program-payout-successful-payment',
    );
    this.paymentsFailedLabel = this.page.getByTestId(
      'program-payout-failed-payment',
    );
  }

  async verifyPaymentPopupValues({
    numberOfPas,
    defaultTransferValue,
    maxTransferValue,
    paymentNumber = 1,
  }: {
    numberOfPas: number;
    defaultTransferValue: number;
    maxTransferValue: number;
    paymentNumber?: number;
  }) {
    // In case of UI delay page should refresh and do payment again with TableModule
    const tableModule = new TableModule(this.page);
    // --------------------------------------------------------------- //
    const paIncludedLabel = includedLabel.replace(
      '{{number}}',
      numberOfPas.toString(),
    );
    const maximumAmountLabel = maxAmountLabel.replace(
      '{{totalCost}}',
      `EUR ${maxTransferValue.toString()}`,
    );

    try {
      await expect(this.page.getByText(paIncludedLabel)).toBeVisible();
      await expect(this.page.getByText(maximumAmountLabel)).toBeVisible();
      await expect(
        this.paymentPopupMakePaymentAmountInput.locator('input'),
      ).toHaveValue(defaultTransferValue.toString());
    } catch (error) {
      await this.page.reload();
      await tableModule.doPayment(paymentNumber);
      await this.verifyPaymentPopupValues({
        numberOfPas,
        defaultTransferValue,
        maxTransferValue,
      });
    }
  }

  async executePayment({
    numberOfPas,
    defaultTransferValue,
    maxTransferValue,
  }: {
    numberOfPas: number;
    defaultTransferValue: number;
    maxTransferValue: number;
  }) {
    await this.verifyPaymentPopupValues({
      numberOfPas,
      defaultTransferValue,
      maxTransferValue,
    });

    // execute payment
    await this.paymentPopupMakePaymentButton.click();

    // make sure the payment was successful
    // need to split up the label to avoid issues with the <br> tag
    const paSuccessfulLabel = succesfullLabel;
    let paSuccessfulLabelChunk = paSuccessfulLabel.split('<br>')[0];
    expect(paSuccessfulLabelChunk).toContain('{{nrPa}}');
    paSuccessfulLabelChunk = paSuccessfulLabelChunk.replace(
      '{{nrPa}}',
      numberOfPas.toString(),
    );
    await expect(this.page.getByText(paSuccessfulLabelChunk)).toBeVisible();

    // Close popup
    await this.page
      .getByRole('button', {
        name: ok,
      })
      .click();
  }

  async validatePaymentStatus({}) {
    try {
      while (true) {
        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
        if (!(await this.paymentStatus.isVisible())) {
          break;
        }
      }
    } catch (error) {
      throw new Error('Payment status element does not exist in DOM.');
    }
  }

  async retryPayment({ buttonName }: { buttonName: string }) {
    const okButton = this.page.getByRole('button', { name: buttonName });

    await this.paymentRetryButton.click();

    await okButton.click();
    await this.page.waitForLoadState('networkidle');
    await okButton.click();
  }

  async validatePaymentCount({
    payments,
    label,
  }: {
    payments: number;
    label: Locator;
  }) {
    await this.page.waitForLoadState('networkidle');
    let paymentsText = await label.innerText();
    paymentsText = paymentsText.replace(/\D/g, ''); // remove non-numeric characters
    const paymentsNumber = Number(paymentsText);

    await expect(this.paymentStatus).toBeHidden();
    expect(paymentsNumber).toBe(payments);
  }

  async validateFailedPaymentStatus({ payments }: { payments: number }) {
    await this.validatePaymentCount({
      payments,
      label: this.paymentsFailedLabel,
    });
  }

  async validateSuccessfulPaymentStatus({ payments }: { payments: number }) {
    await this.validatePaymentCount({
      payments,
      label: this.paymentSuccessfulLabel,
    });
    await expect(this.paymentRetryButton).toBeHidden();
  }
}

export default PaymentsPage;
