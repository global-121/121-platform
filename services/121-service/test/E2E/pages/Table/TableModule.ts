import { Page } from 'playwright';

class TableModule {
  page: Page;


  constructor(page: Page) {
    this.page = page;
  }

  async validateTableContent() {

  }
}

export default TableModule;
