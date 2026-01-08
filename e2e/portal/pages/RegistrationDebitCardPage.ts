import { Locator } from 'playwright';

import DataListComponent from '../components/DataListComponent';
import RegistrationBasePage from './RegistrationBasePage';

class RegistrationDebitCardPage extends RegistrationBasePage {
  async getCurrentDebitCardElement(): Promise<Locator> {
    return this.page.getByTestId('wallet-current-card-list');
  }

  async getSubstituteDebitCardElement(): Promise<Locator> {
    return this.page.getByTestId('old-card-list');
  }

  async getLinkDebitCardInput(): Promise<Locator> {
    return this.page.getByTestId('serial-number-input');
  }

  async getCurrentDebitCardDataList(): Promise<Record<string, string>> {
    return new DataListComponent(
      await this.getCurrentDebitCardElement(),
    ).getData();
  }

  async getSubstituteDebitCardDataList(): Promise<Record<string, string>> {
    return new DataListComponent(
      await this.getSubstituteDebitCardElement(),
    ).getData();
  }

  async getMainPageReplaceCardButton(): Promise<Locator> {
    return this.page.getByRole('button', { name: 'Replace card' });
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

  async clickMainPageReplaceCardButton(): Promise<void> {
    const replaceCardButton = await this.getMainPageReplaceCardButton();
    await replaceCardButton.click();
  }

  async replaceVisaCard(serialNumber: string): Promise<void> {
    const replaceCardButton = await this.getReplaceCardButton();
    const linkCardInput = await this.getLinkDebitCardInput();

    await linkCardInput.fill(serialNumber);
    await replaceCardButton.click();
  }

  async closeLinkDebitCardModal(): Promise<void> {
    const cancelButton = this.page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
  }

  async goBackToLinkDebitCardModal(): Promise<void> {
    const goBackButton = this.page.getByTestId('go-back-button');
    await goBackButton.click();
  }
}

export default RegistrationDebitCardPage;
