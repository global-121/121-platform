import { expect } from '@playwright/test';
import { Page } from 'playwright';

class HomePage {
  page: Page;
  activeProgramsbanner = 'p.ion-no-margin';

  constructor(page: Page) {
    this.page = page;
  }

  async validateNumberOfActivePrograms(amount: number) {
    expect(await this.page.locator(this.activeProgramsbanner).textContent()).toContain(`You are running ${amount} program(s) actively`);
  }

  async openPAsForRegistration() {
    await this.page.getByText('NLRC OCW program').click();
    await this.page.getByText('Open for Registration').click();
    const openForRegistrationBanner = this.page.getByRole('heading', { name: 'Open for registration' });
    // expect(await openForRegistrationBanner.isVisible()).toBeTruthy();
    await this.page.getByRole('button', { name: 'OK' }).click();
  }
}

export default HomePage;
