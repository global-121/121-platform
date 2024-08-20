import { Page } from 'playwright';
import BasePage from './BasePage';

class ManageTeam extends BasePage {
  page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  async clickAddTeamMember() {
    await this.page.click('text=Add team member');
  }
}

export default ManageTeam;
