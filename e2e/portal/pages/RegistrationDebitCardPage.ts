import { Locator } from 'playwright';

import DataListComponent from '../components/DataListComponent';
import RegistrationBasePage from './RegistrationBasePage';

class RegistrationDebitCardPage extends RegistrationBasePage {
  async getCurrentDebitCardElement(): Promise<Locator> {
    return this.page.getByTestId('wallet-current-card-list');
  }

  async getCurrentDebitCardDataList(): Promise<Record<string, string>> {
    return new DataListComponent(
      await this.getCurrentDebitCardElement(),
    ).getData();
  }

  async getPauseCardButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: 'Pause card' });
  }

  async getUnpauseCardButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: 'Unpause card' });
  }

  async getReplaceCardButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: 'Replace card' });
  }

  async getLinkCardButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: 'Link visa card' });
  }
}

export default RegistrationDebitCardPage;
