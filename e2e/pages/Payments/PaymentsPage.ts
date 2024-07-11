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
  readonly paymentDropdown: Locator;

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
    this.paymentDropdown = this.page.getByTestId('program-payout-dropdown');
  }

  async verifyPaymentPopupValues({
    numberOfPas,
    defaultTransferValue,
    defaultMaxTransferValue,
    newTransferValue,
    newMaxTransferValue,
    paymentNumber = 1,
  }: {
    numberOfPas: number;
    defaultTransferValue: number;
    defaultMaxTransferValue: number;
    newTransferValue?: number;
    newMaxTransferValue?: number;
    paymentNumber?: number;
  }) {
    // In case of UI delay page should refresh and do payment again with TableModule
    const tableModule = new TableModule(this.page);
    // --------------------------------------------------------------- //
    const paIncludedLabel = includedLabel.replace(
      '{{number}}',
      numberOfPas.toString(),
    );
    let maximumAmountLabel = maxAmountLabel.replace(
      '{{totalCost}}',
      `EUR ${defaultMaxTransferValue.toString()}`,
    );

    try {
      await expect(this.page.getByText(paIncludedLabel)).toBeVisible();
      await expect(this.page.getByText(maximumAmountLabel)).toBeVisible();
      await expect(
        this.paymentPopupMakePaymentAmountInput.locator('input'),
      ).toHaveValue(defaultTransferValue.toString());
      if (
        newTransferValue != defaultTransferValue &&
        newTransferValue != undefined &&
        newMaxTransferValue != undefined
      ) {
        await this.updateTransferValue({
          newTransferValue: newTransferValue.toString(),
        });
        maximumAmountLabel = maxAmountLabel.replace(
          '{{totalCost}}',
          `EUR ${newMaxTransferValue.toString()}`,
        );
        const paIncluded = this.page.getByText(paIncludedLabel);
        await expect(paIncluded).toBeVisible();
        await paIncluded.click();
        await expect(this.page.getByText(maximumAmountLabel)).toBeVisible();
      }
    } catch (error) {
      await this.page.reload();
      await tableModule.doPayment(paymentNumber);
      await this.verifyPaymentPopupValues({
        numberOfPas,
        defaultTransferValue,
        defaultMaxTransferValue,
        newTransferValue,
      });
    }
  }

  async updateTransferValue({
    newTransferValue,
  }: {
    newTransferValue: string;
  }) {
    const numericInput =
      this.paymentPopupMakePaymentAmountInput.getByRole('spinbutton');
    const oldValue = await numericInput.inputValue();
    await numericInput.fill(newTransferValue);
    await numericInput.click();
    const newValue = await numericInput.inputValue();
    expect(newValue).not.toEqual(oldValue);
  }

  async executePayment({
    numberOfPas,
    defaultTransferValue,
    defaultMaxTransferValue,
    newTransferValue,
    newMaxTransferValue,
  }: {
    numberOfPas: number;
    defaultTransferValue: number;
    defaultMaxTransferValue: number;
    newTransferValue?: number;
    newMaxTransferValue?: number;
  }) {
    await this.verifyPaymentPopupValues({
      numberOfPas,
      defaultTransferValue,
      defaultMaxTransferValue,
      newTransferValue,
      newMaxTransferValue,
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

  async verifyPaymentOptionUnderPaymentData({
    paymentNumber = 1,
  }: {
    paymentNumber?: number;
  }) {
    const currentPaymentLabel = `Payment #${paymentNumber}  Closed`;
    const nextPaymentLabel = `Payment #${paymentNumber + 1}  Open`;
    await this.page.waitForLoadState('networkidle');
    await this.paymentDropdown.click();
    const contents = await this.paymentDropdown.allTextContents();
    await this.verifyLabelExist(currentPaymentLabel, contents);
    await this.verifyLabelExist(nextPaymentLabel, contents);
  }

  async selectPaymentOption(optionText: string) {
    // Wait for the dropdown to be visible
    await this.paymentDropdown.waitFor();
    await this.paymentDropdown.click();
    const options = this.paymentDropdown.locator('option');
    // Find the option containing the specified text
    const optionCount = await options.count();
    let found = false;
    for (let i = 0; i < optionCount; i++) {
      const option = options.nth(i);
      const optionValue = await option.textContent();
      if (optionValue && optionValue.includes(optionText)) {
        const optionLabel = await option.getAttribute('value');
        if (optionLabel) {
          // Select the option by value
          await this.paymentDropdown.selectOption({ value: optionLabel });
          found = true;
          console.log(`Selected option containing text: ${optionText}`);
          break;
        }
      }
    }
    // Verify that the option was found and selected
    expect(found).toBe(true);
    await this.paymentDropdown.click();
  }

  async verifyPaymentOptionUnderAction({
    paymentNumber = 1,
  }: {
    paymentNumber?: number;
  }) {
    const tableModule = new TableModule(this.page);
    const contents = await tableModule.GetBulkActionOptions();
    // currently the payment which has been closed will show here too.
    const currentPaymentLabel = `Do payment #${paymentNumber}`;
    await this.verifyLabelExist(currentPaymentLabel, contents);
    const nextPaymentLabel = `Do payment #${paymentNumber + 1}`;
    await this.verifyLabelExist(nextPaymentLabel, contents);
  }
  async openPaymentHistory({ rowIndex = 1 }: { rowIndex?: number }) {
    const tableModule = new TableModule(this.page);
    await tableModule.clickOnPaPayments(rowIndex);
  }

  async openMessage({ rowIndex = 1 }: { rowIndex?: number }) {
    const tableModule = new TableModule(this.page);
    await tableModule.clickOnPaMessage(rowIndex);
  }

  async closePopup(buttonName: string) {
    const cancelButton = this.page.getByRole('button', { name: buttonName });
    await cancelButton.click();
  }

  async verifyLabelExist(label: string, contents: string[]) {
    // Check if any of the dropdown options contain the specified payment label
    const isPaymentPresent = contents.some((content) =>
      content.includes(label),
    );
    expect(isPaymentPresent).toBe(true);
  }
}
export default PaymentsPage;
