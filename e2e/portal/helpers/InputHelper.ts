import { expect, Locator, Page } from '@playwright/test';

import { PrimeNGDatePicker } from '@121-e2e/portal/components/PrimeNGDatePicker';

export class InputHelper {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private resolveLocator({
    locator,
    testId,
  }: {
    locator?: Locator;
    testId?: string;
  }): Locator {
    if (locator) {
      return locator;
    }
    if (testId) {
      return this.page.getByTestId(testId);
    }
    throw new Error('Either locator or testId must be provided.');
  }

  /**
   * Closes any open PrimeNG select or multiselect overlay with retries using Escape.
   */
  async closeOverlayWithRetries({
    retries = 3,
  }: {
    retries?: number;
  } = {}): Promise<void> {
    const overlay = this.page
      .locator('.p-multiselect-overlay')
      .or(this.page.locator('.p-select-overlay'))
      .or(this.page.locator('.p-dropdown-panel'));

    for (let i = 0; i < retries; i++) {
      try {
        if (!(await overlay.isVisible())) {
          return;
        }
        await this.page.keyboard.press('Escape');
        await expect(overlay).not.toBeVisible({ timeout: 1_000 });
        return;
      } catch {
        if (i === retries - 1) {
          throw new Error(
            `Failed to close overlay after ${retries} retry attempts.`,
          );
        }
      }
    }
  }

  /**
   * Selects a single option from a dropdown or select component.
   */
  async selectDropdownOption({
    locator,
    testId,
    option,
    searchPhrase,
    exact = true,
  }: {
    locator?: Locator;
    testId?: string;
    option: string;
    searchPhrase?: string;
    exact?: boolean;
  }): Promise<void> {
    const target = this.resolveLocator({ locator, testId });
    await target.click();

    if (searchPhrase) {
      const searchInput = this.page
        .locator(
          '.p-select-filter, .p-dropdown-filter, input[role="searchbox"]',
        )
        .or(target.locator('input'))
        .first();

      if (await searchInput.isVisible()) {
        await searchInput.fill(searchPhrase);
      } else {
        await target.fill(searchPhrase);
      }
    }

    const optionLocator = this.page
      .getByRole('option', { name: option, exact })
      .or(this.page.getByText(option, { exact }))
      .first();

    await optionLocator.click();
    await this.closeOverlayWithRetries();
  }

  /**
   * Selects multiple options in a PrimeNG multiselect component.
   */
  async selectMultiselectOptions({
    locator,
    testId,
    options,
    closeOverlay = true,
  }: {
    locator?: Locator;
    testId?: string;
    options: string[];
    closeOverlay?: boolean;
  }): Promise<void> {
    const target = this.resolveLocator({ locator, testId });
    await target.click();

    for (const option of options) {
      await this.page.getByRole('option', { name: option }).click();
    }

    if (closeOverlay) {
      await this.closeOverlayWithRetries();
    }
  }

  /**
   * Checks whether a checkbox (native or PrimeNG) is currently checked.
   */
  async isCheckboxChecked({ locator }: { locator: Locator }): Promise<boolean> {
    const checkboxInput = locator.locator('input[type="checkbox"]');
    const hasInput = (await checkboxInput.count()) > 0;
    const target = hasInput ? checkboxInput.first() : locator;

    try {
      return await target.isChecked();
    } catch {
      const ariaChecked = await locator.getAttribute('aria-checked');
      if (ariaChecked !== null) {
        return ariaChecked === 'true';
      }
      const classAttr = (await locator.getAttribute('class')) ?? '';
      return classAttr.includes('p-checkbox-checked');
    }
  }

  /**
   * Sets a checkbox to the desired checked state (checked or unchecked).
   */
  async setCheckbox({
    locator,
    checked,
  }: {
    locator: Locator;
    checked: boolean;
  }): Promise<void> {
    const currentState = await this.isCheckboxChecked({ locator });
    if (currentState !== checked) {
      await locator.click();
    }
  }

  /**
   * Checks whether a switch / toggle component is checked.
   */
  async isSwitchChecked({ locator }: { locator: Locator }): Promise<boolean> {
    const ariaChecked = await locator.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      return ariaChecked === 'true';
    }
    return locator.isChecked();
  }

  /**
   * Sets a switch / toggle to the desired state.
   */
  async setSwitch({
    locator,
    checked,
  }: {
    locator: Locator;
    checked: boolean;
  }): Promise<void> {
    const isCurrentlyChecked = await this.isSwitchChecked({ locator });
    if (isCurrentlyChecked !== checked) {
      await locator.click();
    }
  }

  /**
   * Fills a text input or textarea, with optional pre-clearing.
   */
  async fillTextInput({
    locator,
    value,
    clearFirst = true,
  }: {
    locator: Locator;
    value: string;
    clearFirst?: boolean;
  }): Promise<void> {
    if (clearFirst) {
      await locator.fill('');
    }
    await locator.fill(value);
  }

  /**
   * Fills a numeric or spinbutton input.
   */
  async fillNumberInput({
    locator,
    value,
  }: {
    locator: Locator;
    value: number;
  }): Promise<void> {
    await locator.fill(String(value));
  }

  /**
   * Selects a date using the PrimeNG date picker component.
   */
  async selectDate({
    locator,
    targetDate,
  }: {
    locator: Locator;
    targetDate: Date;
  }): Promise<void> {
    const datePicker = new PrimeNGDatePicker({
      page: this.page,
      datePicker: locator,
    });
    await datePicker.selectDate({ targetDate });
  }

  /**
   * Clears a date picker input.
   */
  async clearDate({ locator }: { locator: Locator }): Promise<void> {
    const datePicker = new PrimeNGDatePicker({
      page: this.page,
      datePicker: locator,
    });
    await datePicker.clearDate();
  }

  /**
   * Handles file chooser and uploads a file.
   */
  async uploadFile({
    triggerLocator,
    filePath,
  }: {
    triggerLocator: Locator;
    filePath: string;
  }): Promise<void> {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await triggerLocator.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }
}

export default InputHelper;
