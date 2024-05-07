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
  tabButton = 'ion-button[fill="clear"][size="small"]';
  historyTile = 'article';
  historyTileText = 'span';
  historyTileTimeStamp = 'time';
  tileInformationPlaceHolder = 'strong';

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
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector(this.editPersonAffectedPopUp);
    const isVisible = await this.page
      .locator(this.editPersonAffectedPopUp)
      .isVisible();
    expect(isVisible).toBe(true);
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
    await this.page.waitForLoadState('networkidle');
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

  async issueNewVisaDebitCard() {
    try {
      const activeCard = this.page
        .locator(this.debitCardStatus)
        .filter({ hasText: 'Active' });
      await activeCard.waitFor({ state: 'visible' });
      await activeCard.click();

      const issueNewCardButton = this.page.getByRole('button', {
        name: 'Issue new card',
      });
      await issueNewCardButton.waitFor({ state: 'visible' });
      await issueNewCardButton.click();

      for (let i = 0; i < 2; i++) {
        const okButton = this.page.getByRole('button', { name: 'OK' });
        await okButton.waitFor({ state: 'visible' });
        await okButton.click();
      }
    } catch (error) {
      console.error(`Failed to issue new Visa debit card: ${error}`);
    }
  }

  async openActivityOverviewTab(tabName: string) {
    await this.page
      .locator(this.tabButton)
      .filter({ hasText: tabName })
      .locator('button')
      .click();
  }

  async validateChangeLogTile(
    changeTitle: string,
    userName: string,
    date: string,
    oldValue: string,
    newValue: string,
  ) {
    const historyTile = this.page.locator(this.historyTile).nth(0);
    const oldValueHolder = this.page
      .locator(this.tileInformationPlaceHolder)
      .filter({ hasText: 'Old:' })
      .nth(0);
    const newValueHolder = this.page
      .locator(this.tileInformationPlaceHolder)
      .filter({ hasText: 'New:' })
      .nth(0);

    expect(await historyTile.isVisible()).toBe(true);
    expect(
      await historyTile
        .locator(this.historyTileText)
        .filter({ hasText: changeTitle })
        .textContent(),
    ).toContain(changeTitle);
    expect(
      await historyTile
        .locator(this.historyTileText)
        .filter({ hasText: userName })
        .textContent(),
    ).toContain(userName);
    expect(
      await historyTile.locator(this.historyTileTimeStamp).textContent(),
    ).toContain(date);
    expect(await oldValueHolder.textContent()).toContain(oldValue);
    expect(await newValueHolder.textContent()).toContain(newValue);
  }

  async validateSentMessagesTab(
    messageNotification: string,
    messageContext: string,
    messageType: string,
  ) {
    const paymentNotificationLocator = this.page.locator(
      `:text("${messageContext} (${messageType})")`,
    );
    const messageNotificationLocator = this.page.locator(
      `:text("${messageNotification}")`,
    );
    await paymentNotificationLocator.waitFor({ state: 'visible' });
    await messageNotificationLocator.waitFor({ state: 'visible' });
    expect(await messageNotificationLocator.textContent()).toContain(
      `${messageNotification}`,
    );
    expect(await paymentNotificationLocator.textContent()).toContain(
      `${messageContext} (${messageType})`,
    );
  }

  async validatePaymentsTab(
    paymentLabel: string,
    paymentNumber: number,
    statusLabel: string,
    userName: string,
    date: string,
  ) {
    await expect(
      this.page.locator(this.historyTileText).filter({
        hasText: `${paymentLabel} #${paymentNumber} ${statusLabel}`,
      }),
    ).toBeVisible();
    await this.page.getByTitle(userName).click();
    expect(
      await this.page.locator(this.historyTileTimeStamp).textContent(),
    ).toContain(date);
  }
}

export default RegistrationDetails;
