import { Locator, Page } from 'playwright';
import BasePage from './BasePage';

class CreateProject extends BasePage {
  page: Page;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.submitButton = this.page.getByRole('button', {
      name: 'Submit',
    });
  }

  async submitForm() {
    await this.submitButton.click();
  }
}

export default CreateProject;
