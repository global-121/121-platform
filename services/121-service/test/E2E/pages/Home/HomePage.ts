import { expect } from '@playwright/test';
import { Page } from 'playwright';

class HomePage {
  page: Page;
  activeProgramsBanner = 'p.ion-no-margin';
  programCard = 'app-program-card';
  openPAsForRegistrationButton = 'ion-button.ion-margin-start';
  okButton = 'ion-button[fill="solid"][color="primary"]:has-text("OK")';

  constructor(page: Page) {
    this.page = page;
  };

  async validateNumberOfActivePrograms(amount: number) {
    expect(await this.page.locator(this.activeProgramsBanner).textContent()).toContain(`You are running ${amount} program(s) actively`);
  };

  async openPAsForRegistrationOcwProgram(programName: string) {
    await this.page.locator(this.programCard).filter({ hasText: programName }).click();
    await this.page.locator(this.openPAsForRegistrationButton).click();
    await this.page.locator(this.okButton).click();
  };
}

export default HomePage;
