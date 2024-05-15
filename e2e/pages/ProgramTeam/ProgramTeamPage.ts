import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';

class ProgramTeam {
  readonly page: Page;
  readonly addTeamMemberButton: Locator;
  readonly addTeamMemberPopUp: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTeamMemberButton = this.page.getByTestId('add-team-member-button');
    this.addTeamMemberPopUp = this.page.getByTestId(
      'add-new-team-member-pop-up-content',
    );
  }

  async openAddNewTeamMemberPoUp() {
    await this.addTeamMemberButton.click();
  }

  async validateAddTeamMemberPopUpIsPresent() {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.addTeamMemberPopUp).toBeVisible();
  }
}

export default ProgramTeam;
