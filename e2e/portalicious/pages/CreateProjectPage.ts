import { Locator, Page } from 'playwright';
import BasePage from './BasePage';

class CreateProject extends BasePage {
  page: Page;
  readonly submitButton: Locator;
  readonly assetIdInput: Locator;
  readonly tokenInput: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.submitButton = this.page.getByRole('button', {
      name: 'Submit',
    });
    this.assetIdInput = this.page.locator('[formcontrolname="assetId"]');
    this.tokenInput = this.page.locator('[formcontrolname="token"]');
  }

  async fillInForm({
    assetId = '',
    token = '',
  }: {
    assetId?: string;
    token?: string;
  }) {
    await this.assetIdInput.fill(assetId);
    await this.tokenInput.fill(token);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async assertCreateProjectSuccessPopUp() {
    await this.validateToastMessage('Project successfully created.');
  }
}

export default CreateProject;
