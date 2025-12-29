import { Locator } from 'playwright';

import DataListComponent from '../components/DataListComponent';
import RegistrationBasePage from './RegistrationBasePage';

class RegistrationDebitCardPage extends RegistrationBasePage {
  async getCurrentDebitCardElement(): Promise<Locator> {
    return this.page.getByTestId('wallet-current-card-list');
  }

  async getLinkDebitCardInput(): Promise<Locator> {
    return this.page.getByTestId('serial-number-input');
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
    return this.page.getByRole('button', { name: 'Replace card', exact: true });
  }

  async getLinkVisaCardButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: 'Link visa card' });
  }

  async getLinkCardButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: 'Link card' });
  }

  async linkVisaCard(serialNumber: string): Promise<void> {
    const linkVisaCardButton = await this.getLinkVisaCardButton();
    const linkCardInput = await this.getLinkDebitCardInput();
    const linkCardButton = await this.getLinkCardButton();

    await linkVisaCardButton.click();
    await linkCardInput.fill(serialNumber);
    await linkCardButton.click();
  }
}

export default RegistrationDebitCardPage;
