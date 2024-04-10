import { expect } from '@playwright/test';
import { Page } from 'playwright';

class RegistrationDetails {
  page: Page;
  personAffectedActivityOverviewHeader = 'h1.ion-padding-start.ion-no-margin';
  registratrationDetailsHeader = 'h1.ion-no-margin:has-text("Registration details")';

  constructor(page: Page) {
    this.page = page;
  }

  async validatePaProfileOpened() {
    await this.page.waitForURL(/\/registration\//);
    expect(await this.page.locator(this.registratrationDetailsHeader).textContent()).toContain(`Registration details`);
    expect(await this.page.locator(this.personAffectedActivityOverviewHeader).isVisible());
  }

}

export default RegistrationDetails;
