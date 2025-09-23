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
  }

  async selectDateRange({ start, end }: { start: Date; end: Date }) {
    await this.dateRangeStartInput.selectDate({ targetDate: start });
    await this.dateRangeEndInput.selectDate({ targetDate: end });
  }

  async clickEditSectionByTitle(title: 'Basic information' | 'Budget') {
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
