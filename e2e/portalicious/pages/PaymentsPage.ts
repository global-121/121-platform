import { Page } from 'playwright';

import BasePage from '@121-e2e/portalicious/pages/BasePage';

class PaymentsPage extends BasePage {
  readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }
}

export default PaymentsPage;
