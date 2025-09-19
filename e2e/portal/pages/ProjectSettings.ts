import { Locator, Page } from 'playwright';

import BasePage from './BasePage';

class ProjectSettings extends BasePage {
  readonly saveButton: Locator;
  readonly projectDescriptionInput: Locator;
  readonly dateRangeStartInput: Locator;
  readonly dateRangeEndInput: Locator;

  constructor(page: Page) {
    super(page);
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.projectDescriptionInput = this.page.getByLabel('Project description');
    this.dateRangeStartInput = this.page.getByLabel('Start date');
    this.dateRangeEndInput = this.page.getByLabel('End date');
  }

  async selectDatePickerDate(input: Locator, targetDate: Date) {
    await input.click();
    await input.fill('');
    // Resets date picker input to show current month and year
    await this.page.waitForTimeout(200); // Wait for datePicker to be cleared
    await this.projectDescriptionInput.click();
    await input.click();

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

  async selectDateRange({
    dateRange,
  }: {
    dateRange: { start: Date; end: Date };
  }) {
    await this.selectDatePickerDate(this.dateRangeStartInput, dateRange.start);
    await this.selectDatePickerDate(this.dateRangeEndInput, dateRange.end);
  }

  async selectSettings(settingName: 'Project information' | 'Project team') {
    await this.page.getByText(settingName).click();
  }

  async clickEditSectionByTitle(title: string) {
    await this.page.getByTitle(title).getByLabel('Edit team').click();
  }

  async editInformationFieldByLabel(label: string, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  async editProjectDate(date: string) {
    await this.page.getByLabel('Start date').fill(date);
  }

  async saveChanges() {
    await this.saveButton.click();
  }
}

export default ProjectSettings;
