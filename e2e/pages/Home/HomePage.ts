import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';

class HomePage {
  readonly page: Page;
  readonly activeProgramsBanner: Locator;
  readonly programCard: Locator;
  readonly openPAsForRegistrationButton: Locator;
  readonly okButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.activeProgramsBanner = this.page.locator('p.ion-no-margin');
    this.programCard = this.page.locator('app-program-card');
    this.openPAsForRegistrationButton = this.page.locator(
      'ion-button.ion-margin-start',
    );
    this.okButton = this.page.locator(
      'ion-button[fill="solid"][color="primary"]:has-text("OK")',
    );
  }

  async validateNumberOfActivePrograms(amount: number) {
    expect(await this.activeProgramsBanner.textContent()).toContain(
      `You are running ${amount} program(s) actively`,
    );
  }

  async openPAsForRegistrationOcwProgram(programName: string) {
    await this.programCard.filter({ hasText: programName }).click();
    await this.openPAsForRegistrationButton.click();
    await this.okButton.click();
  }

  async navigateToProgramme(programName: string) {
    await this.programCard.filter({ hasText: programName }).click();
  }
}

export default HomePage;
