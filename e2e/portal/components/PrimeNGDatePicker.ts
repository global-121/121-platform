import { Locator, Page } from 'playwright';
import { expect } from 'playwright/test';

export class PrimeNGDatePicker {
  readonly page: Page;
  readonly datePickerField: Locator;
  readonly datePickerPanel: Locator;

  constructor({ page, datePicker }: { page: Page; datePicker: Locator }) {
    this.page = page;
    this.datePickerField = datePicker;
    this.datePickerPanel = this.page.locator('.p-datepicker-panel');
  }

  async clearDate() {
    await this.datePickerField.click();
    await expect(this.datePickerPanel).toBeVisible();
    await this.datePickerField.fill('');
    await this.page.keyboard.press('Escape');
    await expect(this.datePickerPanel).not.toBeVisible();
  }

  async selectDate({ targetDate }: { targetDate: Date }) {
    // start by emptying the date picker input field
    // to make it start with the current date
    await this.clearDate();

    // open the date picker
    await this.datePickerField.click();
    await expect(this.datePickerPanel).toBeVisible();

    // Navigate to the correct month and year
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    while (currentMonth !== targetMonth || currentYear !== targetYear) {
      if (
        currentYear < targetYear ||
        (currentYear === targetYear && currentMonth < targetMonth)
      ) {
        await this.datePickerPanel.locator('.p-datepicker-next-button').click();
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      } else {
        await this.datePickerPanel.locator('.p-datepicker-prev-button').click();
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
    await this.datePickerPanel
      .locator(`[data-date="${formattedDate}"]`)
      .click();
    await expect(this.datePickerPanel).not.toBeVisible();
  }
}
