import { Page } from 'playwright';

import BasePage from './BasePage';

class ProjectMonitoring extends BasePage {
  page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }
}

export default ProjectMonitoring;
