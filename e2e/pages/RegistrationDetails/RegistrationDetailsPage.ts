import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';

class RegistrationDetails {
  readonly page: Page;
  readonly personAffectedActivityOverviewHeader: Locator;
  readonly registratrationDetailsHeader: Locator;
  readonly personalInformationTable: Locator;
  readonly personAffectedName: Locator;
  readonly personAffectedStatus: Locator;
  readonly personAffectedStatusDateUpdate: Locator;
  readonly primaryLanguage: Locator;
  readonly phoneNumber: Locator;
  readonly financialServiceProvider: Locator;
  readonly showAllButton: Locator;
  readonly editPersonAffectedPopUp: Locator;
  readonly financialServiceProviderDropdown: Locator;
  readonly debitCardPaTable: Locator;
  readonly debitCardStatus: Locator;
  readonly tabButton: Locator;
  readonly historyTile: Locator;
  readonly historyTileTitle: Locator;
  readonly historyTileUserName: Locator;
  readonly historyTileTimeStamp: Locator;
  readonly tileInformationPlaceHolder: Locator;
  readonly tileInformationStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.registratrationDetailsHeader = this.page.locator(
      'h1.ion-no-margin:has-text("Registration details")',
    );
    this.personAffectedActivityOverviewHeader = this.page.locator(
      'h1.ion-padding-start.ion-no-margin',
    );
    this.personalInformationTable = this.page.locator(
      'app-registration-personal-information',
    );
    this.personAffectedName = this.page.locator('ion-card-subtitle ion-note');
    this.personAffectedStatus = this.page.locator('ion-label:text("Status")');
    this.personAffectedStatusDateUpdate = this.page.locator(
      'ion-item:has(ion-label:has-text("Status")) ion-label strong',
    );
    this.primaryLanguage = this.page.locator(
      'ion-item:has(ion-label:has-text("Primary language")) ion-label strong',
    );
    this.phoneNumber = this.page.locator(
      'ion-item:has(ion-label:has-text("Phone number")) ion-label strong',
    );
    this.financialServiceProvider = this.page.locator(
      'ion-item:has(ion-label:has-text("Financial")) ion-label strong',
    );
    this.showAllButton = this.page.locator('ion-button:text("Show All")');
    this.editPersonAffectedPopUp = this.page.locator(
      'app-edit-person-affected-popup',
    );
    this.financialServiceProviderDropdown = this.page.locator(
      'app-update-fsp #select-label',
    );
    this.debitCardPaTable = this.page.locator('ion-card-title');
    this.debitCardStatus = this.page.locator('ion-label');
    this.tabButton = this.page.locator(
      '[data-testid="activity-detail-tab-button"]',
    );
    this.historyTile = this.page.locator(
      '[data-testid="activity-detail-tile"]',
    );
    this.historyTileTitle = this.page.locator(
      '[data-testid="activity-detail-label"]',
    );
    this.historyTileUserName = this.page.locator(
      '[data-testid="activity-detail-username"]',
    );
    this.historyTileTimeStamp = this.page.locator(
      '[data-testid="activity-detail-date"]',
    );
    this.tileInformationPlaceHolder = this.page.locator(
      '[data-testid="activity-detail-change"]',
    );
    this.tileInformationStatus = this.page.locator(
      '[data-testid="activity-detail-status"]',
    );
  }

  async validatePaProfileOpened() {
    await this.page.waitForURL(/\/registration\//);
    expect(await this.registratrationDetailsHeader.textContent()).toContain(
      `Registration details`,
    );
    await expect(this.personAffectedActivityOverviewHeader).toBeVisible();
    expect(await this.personAffectedActivityOverviewHeader.isVisible()).toBe(
      true,
    );
  }

  async validatePersonalInformationTable(
    name: string,
    status: string,
    date: string,
    language: string,
    phoneNumber: string,
    fsp: string,
  ) {
    await expect(this.personalInformationTable).toBeVisible();
    expect(await this.personalInformationTable.isVisible()).toBe(true);
    expect(await this.personAffectedName.textContent()).toContain(name);
    expect(await this.personAffectedStatus.textContent()).toContain(status);
    expect(await this.personAffectedStatusDateUpdate.textContent()).toContain(
      date,
    );
    expect(await this.primaryLanguage.textContent()).toContain(language);
    expect(await this.phoneNumber.textContent()).toContain(phoneNumber);
    expect(await this.financialServiceProvider.textContent()).toContain(fsp);
  }

  async openEditPaPopUp() {
    const showAllButton = this.page.getByTestId('show-all-button');
    await showAllButton.click();
  }

  async validateEditPaPopUpOpened() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.editPersonAffectedPopUp.waitFor({ state: 'visible' });
    const isVisible = await this.editPersonAffectedPopUp.isVisible();
    expect(isVisible).toBe(true);
  }

  async validateFspNamePresentInEditPopUp(fspName: string) {
    await this.page.waitForLoadState('networkidle');
    const fspLocator = this.financialServiceProviderDropdown.getByText(fspName);
    await fspLocator.scrollIntoViewIfNeeded();
    expect(await fspLocator.isVisible()).toBe(true);
  }

  async validateDebitCardStatus(status: string) {
    await this.page.waitForLoadState('networkidle');
    expect(
      await this.debitCardPaTable
        .filter({ hasText: 'Debit cards' })
        .isVisible(),
    ).toBe(true);
    expect(
      await this.debitCardStatus.filter({ hasText: status }).isVisible(),
    ).toBe(true);
  }

  async issueNewVisaDebitCard() {
    try {
      const activeCard = this.debitCardStatus.filter({ hasText: 'Active' });
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
    await this.tabButton.filter({ hasText: tabName }).locator('button').click();
  }

  async validateChangeLogTile(
    changeTitle: string,
    userName: string,
    date: string,
    oldValue: string,
    newValue: string,
  ) {
    const historyTile = this.historyTile.nth(0);
    const oldValueHolder = this.tileInformationPlaceHolder
      .filter({ hasText: 'Old:' })
      .nth(0);
    const newValueHolder = this.tileInformationPlaceHolder
      .filter({ hasText: 'New:' })
      .nth(0);

    expect(await historyTile.isVisible()).toBe(true);
    expect(
      await historyTile
        .locator(this.historyTileTitle)
        .filter({ hasText: changeTitle })
        .textContent(),
    ).toContain(changeTitle);
    expect(
      await historyTile
        .locator(this.historyTileUserName)
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
    const historyTile = this.historyTile.nth(0);
    const paymentLocator = this.historyTileTitle.filter({
      hasText: `${paymentLabel} #${paymentNumber}`,
    });
    const statusLocator = this.tileInformationStatus.filter({
      hasText: statusLabel,
    });
    const timeStampLocator = this.historyTileTimeStamp;

    expect(await paymentLocator.textContent()).toContain(paymentLabel);
    expect(await statusLocator.textContent()).toContain(statusLabel);
    expect(
      await historyTile
        .locator(this.historyTileUserName)
        .filter({ hasText: userName })
        .textContent(),
    ).toContain(userName);
    expect(await timeStampLocator.textContent()).toContain(date);
  }
}

export default RegistrationDetails;
