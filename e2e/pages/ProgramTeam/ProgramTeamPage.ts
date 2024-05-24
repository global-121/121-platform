import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';

class ProgramTeam {
  readonly page: Page;
  readonly addTeamMemberButton: Locator;
  readonly addTeamMemberPopUp: Locator;
  readonly addTeamMemberRolesDropdown: Locator;
  readonly addTeamMemberSearchbar: Locator;
  readonly editTeamMemberButton: Locator;
  readonly removeTeamMemberButton: Locator;
  readonly removeUserButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTeamMemberButton = this.page.getByTestId(
      'program-team-add-member-button',
    );
    this.addTeamMemberPopUp = this.page.getByTestId(
      'program-team-popup-add-new-team-member',
    );
    this.addTeamMemberRolesDropdown = this.page.getByTestId(
      'add-team-member-popup-roles-dropdown',
    );
    this.addTeamMemberSearchbar = this.page.getByTestId(
      'add-team-member-searchbar',
    );
    this.editTeamMemberButton = this.page.getByTestId(
      'program-team-table-edit-member-button',
    );
    this.removeTeamMemberButton = this.page.getByTestId('remove-team-member');
    this.removeUserButton = this.page.getByTestId(
      'remove-team-member-popup-content-button',
    );
  }

  async openAddNewTeamMemberPoUp() {
    await this.addTeamMemberButton.click();
  }

  async validateAddTeamMemberPopUpIsPresent() {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.addTeamMemberPopUp).toBeVisible();
  }

  async openRolesDropdown() {
    await this.addTeamMemberRolesDropdown.click();
  }

  async fillInTeamMemberName({ name }: { name: string }) {
    await this.page.getByPlaceholder('Select a team member').fill(name);
    await this.page.getByRole('button', { name: name }).click();
  }

  async clickEditTeamMember({ noteIndex = 0 }: { noteIndex?: number }) {
    await this.page.waitForLoadState('networkidle');
    await this.editTeamMemberButton.nth(noteIndex).click();
    await this.page.getByRole('button', { name: 'Edit' }).click();
  }

  async clickDeleteTeamMember({ noteIndex = 0 }: { noteIndex?: number }) {
    await this.page.waitForLoadState('networkidle');
    await this.page
      .getByRole('row')
      .getByLabel('Options')
      .nth(noteIndex)
      .click();
    await this.removeTeamMemberButton.click();
  }

  async removeUser() {
    await this.removeUserButton.click();
  }
}

export default ProgramTeam;
