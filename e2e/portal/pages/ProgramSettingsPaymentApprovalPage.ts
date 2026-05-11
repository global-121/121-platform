import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

import BasePage from '@121-e2e/portal/pages/BasePage';

class ProgramSettingsPaymentApprovalPage extends BasePage {
  readonly editPaymentApprovalButton: Locator;
  readonly addApprovalStepButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly firstStepUsersDropdown: Locator;
  readonly firstStepUserOptions: Locator;
  readonly additionalStepThresholdInputs: Locator;

  constructor(page: Page) {
    super(page);
    this.editPaymentApprovalButton = this.page.getByRole('button', {
      name: 'Edit payment approval settings',
    });
    this.addApprovalStepButton = this.page.getByRole('button', {
      name: 'Add approval step',
    });
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
    this.firstStepUsersDropdown = this.page.locator(
      '[formcontrolname="firstStepUserIds"]',
    );
    this.firstStepUserOptions = this.page
      .getByRole('listbox', { name: 'Option List' })
      .getByRole('option');
    this.additionalStepThresholdInputs = this.page.locator(
      '[formcontrolname="thresholdAmount"] input',
    );
  }

  async navigateToPaymentApprovalSettings({
    programId,
  }: {
    programId: number;
  }) {
    await this.goto(`/program/${programId}/settings/users/payment-approval`);
    await this.waitForPageLoad();
  }

  async enableEditMode() {
    await this.editPaymentApprovalButton.click();
  }

  async selectOneAvailableFirstStepUser(): Promise<string> {
    await this.firstStepUsersDropdown.click();
    const optionList = this.page.getByRole('listbox', { name: 'Option List' });
    await expect(optionList).toBeVisible();

    const options = optionList.getByRole('option');
    const optionCount = await options.count();

    let selectedUser: string | undefined;

    for (let index = 0; index < optionCount; index++) {
      const option = options.nth(index);
      const optionText = (await option.textContent())?.trim();

      if (!optionText) {
        continue;
      }

      await option.click();
      selectedUser = optionText;
      break;
    }

    if (!selectedUser) {
      throw new Error('No suitable approver options available in first step');
    }

    await this.page.keyboard.press('Escape');

    return selectedUser;
  }

  async savePaymentApprovalSettings() {
    await this.saveButton.click();
  }

  async validatePaymentApprovalEditIsOpen() {
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }

  async validatePaymentApprovalEditIsClosed() {
    await expect(this.editPaymentApprovalButton).toBeVisible();
  }

  async selectFirstStepUserByText(user: string) {
    await this.firstStepUsersDropdown.click();
    await this.page.getByRole('option', { name: user, exact: true }).click();
    await this.page.keyboard.press('Escape');
  }

  async validateFirstStepUserOptionIsNotVisible(user: string) {
    await this.firstStepUsersDropdown.click();
    await expect(
      this.page.getByRole('option', { name: user, exact: true }),
    ).toHaveCount(0);
    await this.page.keyboard.press('Escape');
  }

  async validateNoFirstStepUserIsPreselected() {
    await this.firstStepUsersDropdown.click();

    await expect(
      this.firstStepUserOptions.filter({
        has: this.page.locator('.p-checkbox-checked'),
      }),
    ).toHaveCount(0);

    await this.page.keyboard.press('Escape');
  }

  async clearAllFirstStepUsers() {
    await this.firstStepUsersDropdown.click();

    // Deselect all currently selected users.
    while (
      await this.firstStepUserOptions
        .filter({ has: this.page.locator('.p-checkbox-checked') })
        .count()
    ) {
      await this.firstStepUserOptions
        .filter({ has: this.page.locator('.p-checkbox-checked') })
        .first()
        .click();
    }

    await this.page.keyboard.press('Escape');
  }

  async setAdditionalStepThreshold({
    stepIndex,
    value,
  }: {
    stepIndex: number;
    value: number;
  }) {
    const input = this.additionalStepThresholdInputs.nth(stepIndex);
    await expect(input).toBeVisible();
    await input.click();
    await input.fill(String(value));
    await input.blur();
  }

  async addApprovalStepAndWaitForThresholdCount(thresholdCount: number) {
    await this.addApprovalStepButton.click();
    await expect
      .poll(async () => this.additionalStepThresholdInputs.count())
      .toBe(thresholdCount);
  }

  async validateErrorMessageVisible(errorText: string) {
    await expect(
      this.page.getByText(errorText, { exact: false }).first(),
    ).toBeVisible();
  }

  async reloadPaymentApprovalSettings({ programId }: { programId: number }) {
    await this.navigateToPaymentApprovalSettings({ programId });
  }

  async validateUsersAreShownInPaymentApprovalTable(users: string[]) {
    for (const user of users) {
      await expect(this.page.getByRole('cell', { name: user })).toBeVisible();
    }
  }

  async validateUserIsShownInPaymentApprovalTable(user: string) {
    await expect(this.page.getByRole('cell', { name: user })).toBeVisible();
  }
}

export default ProgramSettingsPaymentApprovalPage;
