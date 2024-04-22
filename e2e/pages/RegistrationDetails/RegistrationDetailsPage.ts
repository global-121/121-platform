import { expect } from '@playwright/test';
import { Page } from 'playwright';

class RegistrationDetails {
  page: Page;
  personAffectedActivityOverviewHeader = 'h1.ion-padding-start.ion-no-margin';
  registratrationDetailsHeader =
    'h1.ion-no-margin:has-text("Registration details")';
  personalInformationTable = 'app-registration-personal-information';
  personAffectedName = 'ion-card-subtitle ion-note';
  personAffectedStatus = '//ion-label[contains(text(), "Status")]';
  personAffectedStatusDateUpdate =
    '//ion-item[contains(ion-label, "Status")]/ion-label/strong';
  primaryLanguage =
    '//ion-item[contains(ion-label, "Primary language")]/ion-label/strong';
  phoneNumber =
    '//ion-item[contains(ion-label, "Phone number")]/ion-label/strong';
  financialServiceProvider =
    '//ion-item[contains(ion-label, "Financial")]/ion-label/strong';
  showAllButton = 'ion-button:text("Show All")';
  editPersonAffectedPopUp = 'app-edit-person-affected-popup';
  financialServiceProviderDropdown = 'app-update-fsp #select-label';
  debitCardPaTable = 'ion-card-title';
  debitCardStatus = 'ion-label';

  constructor(page: Page) {
    this.page = page;
  }

  async validatePaProfileOpened() {
    await this.page.waitForURL(/\/registration\//);
    expect(
      await this.page.locator(this.registratrationDetailsHeader).textContent(),
    ).toContain(`Registration details`);
    await expect(
      this.page.locator(this.personAffectedActivityOverviewHeader),
    ).toBeVisible();
    expect(
      await this.page
        .locator(this.personAffectedActivityOverviewHeader)
        .isVisible(),
    ).toBe(true);
  }

  async validatePersonalInformationTable(
    name: string,
    status: string,
    date: string,
    language: string,
    phoneNumber: string,
    fsp: string,
  ) {
    await expect(
      this.page.locator(this.personalInformationTable),
    ).toBeVisible();
    expect(
      await this.page.locator(this.personalInformationTable).isVisible(),
    ).toBe(true);
    expect(
      await this.page.locator(this.personAffectedName).textContent(),
    ).toContain(name);
    expect(
      await this.page.locator(this.personAffectedStatus).textContent(),
    ).toContain(status);
    expect(
      await this.page
        .locator(this.personAffectedStatusDateUpdate)
        .textContent(),
    ).toContain(date);
    expect(
      await this.page.locator(this.primaryLanguage).textContent(),
    ).toContain(language);
    expect(await this.page.locator(this.phoneNumber).textContent()).toContain(
      phoneNumber,
    );
    expect(
      await this.page.locator(this.financialServiceProvider).textContent(),
    ).toContain(fsp);
  }

  async openEditPaPopUp() {
    await this.page.click(this.showAllButton);
  }

  async validateEditPaPopUpOpened() {
    await this.page.waitForLoadState('networkidle');
    expect(
      await this.page.locator(this.editPersonAffectedPopUp).isVisible(),
    ).toBe(true);
  }

  async validateFspNamePresentInEditPopUp(fspName: string) {
    await this.page.waitForLoadState('networkidle');
    const fspLocator = this.page
      .locator(this.financialServiceProviderDropdown)
      .getByText(fspName);
    await fspLocator.scrollIntoViewIfNeeded();
    expect(await fspLocator.isVisible()).toBe(true);
  }

  async validateDebitCardStatus(status: string) {
    expect(
      await this.page
        .locator(this.debitCardPaTable)
        .filter({ hasText: 'Debit cards' })
        .isVisible(),
    ).toBe(true);
    expect(
      await this.page
        .locator(this.debitCardStatus)
        .filter({ hasText: status })
        .isVisible(),
    ).toBe(true);
  }
}

export default RegistrationDetails;
