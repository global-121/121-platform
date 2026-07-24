import { Locator, Page } from 'playwright';

import BasePage from '@121-e2e/portal/pages/BasePage';

class HomePage extends BasePage {
  readonly createNewProgramButton: Locator;

  constructor(page: Page) {
    super(page);
    this.createNewProgramButton = this.page.getByRole('button', {
      name: 'Create new program',
    });
  }

  async openCreateNewProgram() {
    await this.createNewProgramButton.click();
  }

  async clickDuplicateProgram({ programName }: { programName: string }) {
    const programCard = this.page
      .locator('app-card-with-link')
      .filter({ hasText: programName });

    const programCardActions = programCard.getByLabel('More actions');
    await programCardActions.click();
    await this.page.getByRole('menuitem', { name: 'Duplicate' }).click();
  }
}

export default HomePage;
