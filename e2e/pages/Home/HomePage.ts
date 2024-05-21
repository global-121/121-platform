import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';

class HomePage {
  readonly page: Page;
  readonly activeProgramsBanner: Locator;
  readonly programCard: Locator;
  readonly openPAsForRegistrationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.activeProgramsBanner = this.page.getByTestId(
      'running-programs-list-header',
    );
    this.programCard = this.page.getByTestId('program-card');
    this.openPAsForRegistrationButton = this.page.getByTestId('button-default');
  }

  async validateNumberOfActivePrograms(amount: number) {
    expect(await this.activeProgramsBanner.textContent()).toContain(
      `You are running ${amount} program(s) actively`,
    );
  }

  async openPAsForRegistrationOcwProgram({
    programName,
    buttonName,
    okButtonName,
  }: {
    programName: string;
    buttonName: string;
    okButtonName: string;
  }) {
    const openForRegistrationButton = this.openPAsForRegistrationButton.filter({
      hasText: buttonName,
    });
    const okButton = this.page.getByRole('button', {
      name: okButtonName,
    });
    await this.programCard.filter({ hasText: programName }).click();
    await openForRegistrationButton.click();
    await okButton.click();
  }

  async navigateToProgramme(programName: string) {
    await this.programCard.filter({ hasText: programName }).click();
  }
}

export default HomePage;
