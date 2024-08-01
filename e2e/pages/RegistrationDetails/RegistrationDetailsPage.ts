import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';
import englishTranslations from '../../../interfaces/Portal/src/assets/i18n/en.json';
import Helpers from '../Helpers/Helpers';

const updateSuccesfullNotification =
  englishTranslations.common['update-success'];
const dataChangesKeyValuePair =
  englishTranslations['registration-details']['activity-overview'].activities[
    'data-changes'
  ];

class RegistrationDetails {
  readonly page: Page;
  readonly personalInformationTable: Locator;
  readonly personAffectedName: Locator;
  readonly personAffectedStatus: Locator;
  readonly personAffectedStatusDateUpdate: Locator;
  readonly primaryLanguage: Locator;
  readonly phoneNumber: Locator;
  readonly financialServiceProvider: Locator;
  readonly showAllButton: Locator;
  readonly editPersonAffectedPopUp: Locator;

  readonly tabButton: Locator;
  readonly historyTile: Locator;
  readonly historyTileTitle: Locator;
  readonly historyTileUserName: Locator;
  readonly historyTileTimeStamp: Locator;
  readonly tileInformationPlaceHolder: Locator;
  readonly tileInformationStatus: Locator;
  readonly tileDetailsDropdownIcon: Locator;
  readonly preferredLanguageDropdown: Locator;
  readonly updateReasonTextArea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.personalInformationTable = this.page.getByTestId(
      'registration-personal-information-data',
    );
    this.personAffectedName = this.page.getByTestId(
      'registration-details-name',
    );
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
    this.showAllButton = this.page.getByTestId('show-all-button');
    this.editPersonAffectedPopUp = this.page.locator(
      'app-edit-person-affected-popup',
    );
    this.tabButton = this.page.getByTestId(
      'registration-activity-detail-tab-button',
    );
    this.historyTile = this.page.getByTestId(
      'registration-activity-detail-tile',
    );
    this.historyTileTitle = this.page.getByTestId(
      'registration-activity-detail-label',
    );
    this.historyTileUserName = this.page.getByTestId(
      'registration-activity-detail-username',
    );
    this.historyTileTimeStamp = this.page.getByTestId(
      'registration-activity-detail-date',
    );
    this.tileInformationPlaceHolder = this.page.getByTestId(
      'registration-activity-detail-change',
    );
    this.tileInformationStatus = this.page.getByTestId(
      'registration-activity-detail-status',
    );
    (this.tileDetailsDropdownIcon = this.page.getByTestId(
      'registration-notification-dropdown-icon',
    )),
      (this.preferredLanguageDropdown = this.page.getByTestId(
        'preferred-language-dropdown',
      ));
    this.updateReasonTextArea = this.page.getByTestId(
      'user-data-update-textarea',
    );
  }

  async validateHeaderToContainText(headerTitle: string) {
    await this.page.waitForURL(/\/registration\//);
    await expect(this.page.getByText(headerTitle)).toBeVisible();
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
    await this.showAllButton.click();
  }

  async validateEditPaPopUpOpened() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.editPersonAffectedPopUp.waitFor({ state: 'visible' });
    const isVisible = await this.editPersonAffectedPopUp.isVisible();
    expect(isVisible).toBe(true);
  }

  async changePreferredLanguage({
    language,
    saveButtonName,
    okButtonName,
  }: {
    language: string;
    saveButtonName: string;
    okButtonName: string;
  }) {
    const dropdown = this.page.getByRole('radio');
    const saveButton = this.page.getByRole('button', {
      name: saveButtonName,
    });
    const okButton = this.page.getByRole('button', {
      name: okButtonName,
    });

    await this.page.waitForLoadState('networkidle');
    await this.preferredLanguageDropdown.click();

    await dropdown.getByText(language).click();
    await this.preferredLanguageDropdown.getByText(saveButtonName).click();

    await this.updateReasonTextArea
      .locator('textarea')
      .fill(`Change language to ${language}`);

    await saveButton.waitFor({ state: 'visible' });
    await saveButton.click();

    await expect(
      this.page.getByText(updateSuccesfullNotification),
    ).toBeVisible();

    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
  }

  async validatePreferredLanguage({ language }: { language: string }) {
    const dropdown = this.preferredLanguageDropdown.locator('#select-label');
    await this.page.waitForLoadState('networkidle');
    expect(await dropdown.innerText()).toContain(language);
  }

  async openReasonForChangePopUp({
    language,
    saveButtonName,
  }: {
    language: string;
    saveButtonName: string;
  }) {
    const dropdown = this.page.getByRole('radio');

    await this.page.waitForLoadState('networkidle');
    await this.preferredLanguageDropdown.click();

    await dropdown.getByText(language).click();
    await this.preferredLanguageDropdown.getByText(saveButtonName).click();

    await this.updateReasonTextArea
      .locator('textarea')
      .fill(`Change language to ${language}`);
  }

  async openActivityOverviewTab(tabName: string) {
    await this.page.waitForLoadState('load');
    await this.tabButton
      .filter({ hasText: tabName })
      .locator('button')
      .click({});
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

  async validateQuantityOfActivity({
    quantity,
    failWithoutReload = false,
  }: {
    quantity: number;
    failWithoutReload?: boolean;
  }) {
    await expect(this.historyTile.nth(0)).toBeVisible();

    if (failWithoutReload) {
      await expect(this.historyTile).toHaveCount(quantity);
      return;
    }

    try {
      await expect(this.historyTile).toHaveCount(quantity);
    } catch (error) {
      // Sometimes the messages take a bit longer to appear
      // Try reloading the page and checking again, but only once
      await this.page.reload();
      await this.validateQuantityOfActivity({
        quantity,
        failWithoutReload: true,
      });
    }
  }

  async validatePaymentsTab({
    paymentLabel,
    paymentNumber,
    statusLabel,
    userName,
    date,
  }: {
    paymentLabel: string;
    paymentNumber: number;
    statusLabel: string;
    userName?: string;
    date?: string;
  }) {
    if (!userName)
      userName =
        process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN ?? 'defaultUserName';
    if (!date) date = await Helpers.getTodaysDate();

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

  async addNote(actions: string, addNote: string) {
    await this.page.getByText(actions).click();
    await this.page.getByText(addNote).click();
  }

  async clickActionButton({ button }: { button: string }) {
    await this.page.getByText(button).click();
  }

  async writeNote({
    placeholder,
    note,
    buttonName,
  }: {
    placeholder: string;
    note: string;
    buttonName: string;
  }) {
    const okButton = this.page.getByRole('button', {
      name: buttonName,
    });
    await expect(okButton).toBeDisabled();
    await this.page.getByPlaceholder(placeholder).fill(note);
    await this.page.waitForLoadState('networkidle');
    await expect(okButton).toBeEnabled();

    // accept note
    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
    // dismiss "saved successfully" popup
    await okButton.waitFor({ state: 'visible' });
    await okButton.click();
  }

  async addEmptyNote({ buttonName }: { buttonName: string }) {
    const okButton = this.page.getByRole('button', {
      name: buttonName,
    });
    await expect(okButton).toBeDisabled();
  }

  async validateNoteTile({
    noteIndex = 0,
    changeTitle,
    userName,
    date,
    noteContent,
  }: {
    noteIndex?: number;
    changeTitle: string;
    userName: string;
    date: string;
    noteContent: string;
  }) {
    const historyTile = this.historyTile.nth(noteIndex);

    await expect(historyTile).toBeVisible();
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
    expect(
      await historyTile.locator(this.tileInformationPlaceHolder).textContent(),
    ).toContain(noteContent);
  }
  async validateMessageContent({ messageContent }: { messageContent: string }) {
    await this.page.waitForLoadState('networkidle');
    const historyTile = this.historyTile.nth(1);
    expect(await historyTile.isVisible()).toBe(true);
    await historyTile.locator(this.tileDetailsDropdownIcon).click();
    expect(
      await historyTile.locator(this.tileInformationPlaceHolder).textContent(),
    ).toContain(messageContent);
  }

  async validateDataChangesTab({
    dataChangesLabel,
    oldValue,
    newValue,
    reason = 'Change multiplier to ' + newValue,
  }: {
    dataChangesLabel: string;
    oldValue: string;
    newValue: string;
    reason?: string;
  }) {
    expect(await this.historyTile.isVisible()).toBe(true);
    const dataAttributes = this.historyTile.filter({
      hasText: dataChangesLabel,
    });

    type DataChangeField = 'new' | 'old' | 'reason';
    const getField = (field: DataChangeField) => dataChangesKeyValuePair[field];
    const getHolder = (field: DataChangeField) =>
      this.tileInformationPlaceHolder
        .filter({ hasText: getField(field) })
        .nth(0);

    const fields: DataChangeField[] = ['new', 'old', 'reason'];
    const values = [oldValue, newValue, reason];

    for (let i = 0; i < fields.length; i++) {
      const holder = getHolder(fields[i]);
      expect(await holder.textContent()).toContain(values[i]);
    }

    expect(await dataAttributes.textContent()).toContain(dataChangesLabel);
  }
}

export default RegistrationDetails;
