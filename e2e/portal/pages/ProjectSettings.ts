import { Page } from 'playwright';

import BasePage from './BasePage';

class ProjectSettings extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async selectSettings(settingName: 'Project information' | 'Project team') {
    await this.page.getByText(settingName).click();
  }
}

export default ProjectSettings;
