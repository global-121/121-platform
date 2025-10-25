import { Locator, Page } from 'playwright';

import DataListComponent from '../components/DataListComponent';
import { PrimeNGDatePicker } from '../components/PrimeNGDatePicker';
import BasePage from './BasePage';

class ProjectSettingsPage extends BasePage {
  readonly saveButton: Locator;
  readonly projectDescriptionInput: Locator;
  readonly dateRangeStartInput: PrimeNGDatePicker;
  readonly dateRangeEndInput: PrimeNGDatePicker;
  readonly basicInformationDataList: DataListComponent;
  readonly budgetDataList: DataListComponent;
  readonly currencyDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.projectDescriptionInput = this.page.getByLabel('Project description');
    this.dateRangeStartInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByLabel('Start date'),
    });
    this.dateRangeEndInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByLabel('End date'),
    });
    this.basicInformationDataList = new DataListComponent(
      this.page.getByTestId('project-basic-information-data-list'),
    );
    this.budgetDataList = new DataListComponent(
      this.page.getByTestId('project-budget-data-list'),
    );
    this.currencyDropdown = this.page.locator(`[formControlName="currency"]`);
  }

  async selectDateRange({ start, end }: { start: Date; end: Date }) {
    // We need to clear dates first, because the date picker
    // will limit the selectable dates based on the current value
    // (e.g. if the start date is set to 2024-06-15, you cannot select
    // an end date before that date, so if you want to select a start
    // date after the current end date, you need to clear the end date first)
    await this.dateRangeStartInput.clearDate();
    await this.dateRangeEndInput.clearDate();

    await this.dateRangeStartInput.selectDate({ targetDate: start });
    await this.dateRangeEndInput.selectDate({ targetDate: end });
  }

  async selectCurrency(currency: string) {
    await this.currencyDropdown.click();
    await this.page
      .getByRole('option', { name: currency, exact: true })
      .click();
  }

  async clickEditProjectInformationSectionByTitle(
    title: 'Basic information' | 'Budget',
  ) {
    const editLabelMap = {
      'Basic information': 'Edit basic information',
      Budget: 'Edit budget',
    };

    await this.page.getByLabel(editLabelMap[title]).click();
  }

  async editInformationFieldByLabel(label: string, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  async saveChanges() {
    await this.saveButton.click();
  }
}

export default ProjectSettingsPage;
