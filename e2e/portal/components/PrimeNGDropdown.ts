import { Locator, Page } from 'playwright';

export class PrimeNGDropdown {
  readonly page: Page;
  readonly dropdownWrapper: Locator;
  readonly dropdownOpener: Locator;

  constructor({ page, testId }: { page: Page; testId: string }) {
    this.page = page;
    this.dropdownWrapper = this.page.getByTestId(testId);
    this.dropdownOpener = this.dropdownWrapper.getByRole('button');
  }

  async selectOption({ label }: { label: string }) {
    await this.dropdownOpener.click();
    await this.dropdownWrapper.getByRole('option', { name: label }).click();
  }
}
