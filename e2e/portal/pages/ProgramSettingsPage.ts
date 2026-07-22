import { expect } from '@playwright/test';
import { format } from 'date-fns/format';
import { Locator, Page } from 'playwright';

import DataListComponent from '../components/DataListComponent';
import { PrimeNGDatePicker } from '../components/PrimeNGDatePicker';
import { ProgramInfo } from '../tests/CreateProgram/create-program-data';
import BasePage from './BasePage';

class ProgramSettingsPage extends BasePage {
  readonly saveButton: Locator;
  readonly programDescriptionInput: Locator;
  readonly dateRangeStartInput: PrimeNGDatePicker;
  readonly dateRangeEndInput: PrimeNGDatePicker;
  readonly basicInformationDataList: DataListComponent;
  readonly budgetDataList: DataListComponent;
  readonly currencyDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.programDescriptionInput = this.page.getByLabel('Program description');
    this.dateRangeStartInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByLabel('Start date'),
    });
    this.dateRangeEndInput = new PrimeNGDatePicker({
      page: this.page,
      datePicker: this.page.getByLabel('End date'),
    });
    this.basicInformationDataList = new DataListComponent(
      this.page.getByTestId('program-basic-information-data-list'),
    );
    this.budgetDataList = new DataListComponent(
      this.page.getByTestId('program-budget-data-list'),
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

  async changeFspSelectionForProgram({ fspNames }: { fspNames: string[] }) {
    await this.clickEditProgramInformationSectionByTitle('Budget');
    await this.selectMultiselectOptions({
      dropdownTestId: 'fsp-multiselect',
      optionsToClick: fspNames,
    });

    await this.saveChanges();
    await this.validateToastMessageAndClose(
      'Budget details saved successfully.',
    );
  }

  async clickProgramInformation() {
    await this.page.getByRole('link', { name: 'Program information' }).click();
  }

  async clickEditProgramInformationSectionByTitle(
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

  async validateProgramDetails({
    programInfo,
    programName,
  }: {
    programInfo: ProgramInfo;
    programName?: string;
  }) {
    const basicInformationData = await this.basicInformationDataList.getData();
    expect(basicInformationData).toEqual({
      '*Program name': programName ?? programInfo.name,
      'Program description': programInfo.description,
      'Start date': format(programInfo.dateRange.start, 'd MMMM yyyy'),
      'End date': format(programInfo.dateRange.end, 'd MMMM yyyy'),
      Location: programInfo.location,
      '*Target registrations': programInfo.targetRegistrations,
      'Enable validation': 'No',
      'Enable scope': 'No',
    });

    const budgetData = await this.budgetDataList.getData();

    expect(budgetData).toEqual({
      'Funds available': programInfo.fundsAvailable,
      '*Currency': programInfo.currency,
      'Default transactions per registration':
        programInfo.defaultNumberOfTransactions,
      '*Fixed transfer value': programInfo.fixedTransferValue,
      '*Financial service providers': programInfo.fsps?.join(''),
    });
  }

  async saveChanges() {
    await this.saveButton.click();
  }
}

export default ProgramSettingsPage;
