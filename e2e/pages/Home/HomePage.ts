import { expect, Locator } from '@playwright/test';
import { Page } from 'playwright';

class HomePage {
  readonly page: Page;
  readonly activeProgramsBanner: Locator;
  readonly programCard: Locator;
  readonly openPAsForRegistrationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.activeProgramsBanner = this.page.getByTestId(
      'update-property-item-list-header',
    );
    this.programCard = this.page.getByTestId('program-list-component-card');
    this.openPAsForRegistrationButton = this.page.getByTestId(
      'confirm-prompt-button-default',
    );
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

  async closeBrowserCompatibilityBanner() {
    await this.page.locator('button').nth(5).click();
  }

  async openMenu() {
    await this.page.getByTestId('header-menu-button').click();
  }
}

export default HomePage;
