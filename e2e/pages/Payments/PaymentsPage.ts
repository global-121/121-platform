import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';
import englishTranslations from '../../../interfaces/Portal/src/assets/i18n/en.json';
// import Helpers from '../Helpers/Helpers';

class PaymentsPage {
  readonly page: Page;
  readonly paymentPopupMakePaymentAmountInput: Locator;
  readonly paymentPopupMakePaymentButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.paymentPopupMakePaymentAmountInput = this.page.getByTestId(
      'make-payment-amount',
    );
    this.paymentPopupMakePaymentButton = this.page.getByRole('button', {
      name: englishTranslations.page.program['program-payout']['start-payout'],
    });
  }

  async verifyPaymentPopupValues({
    numberOfPas,
    defaultTransferValue,
    maxTransferValue,
  }: {
    numberOfPas: number;
    defaultTransferValue: number;
    maxTransferValue: number;
  }) {
    const paIncludedLabel = englishTranslations.page.program['program-payout'][
      'make-payment'
    ]['number-included'].replace('{{number}}', numberOfPas.toString());
    const maximumAmountLabel = englishTranslations.page.program[
      'program-payout'
    ]['total-amount'].replace(
      '{{totalCost}}',
      `EUR ${maxTransferValue.toString()}`,
    );

    await expect(this.page.getByText(paIncludedLabel)).toBeVisible();
    await expect(this.page.getByText(maximumAmountLabel)).toBeVisible();
    await expect(
      this.paymentPopupMakePaymentAmountInput.locator('input'),
    ).toHaveValue(defaultTransferValue.toString());
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
    const paSuccessfulLabel =
      englishTranslations.page.program['program-payout']['result'].api;
    let paSuccessfulLabelChunk = paSuccessfulLabel.split('<br>')[0];
    await expect(paSuccessfulLabelChunk).toContain('{{nrPa}}');
    paSuccessfulLabelChunk = paSuccessfulLabelChunk.replace(
      '{{nrPa}}',
      numberOfPas.toString(),
    );
    await expect(this.page.getByText(paSuccessfulLabelChunk)).toBeVisible();

    // Close popup
    await this.page
      .getByRole('button', {
        name: englishTranslations.common.ok,
      })
      .click();
  }
}

export default PaymentsPage;
