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
}

export default HomePage;
