import { Locator, expect } from '@playwright/test';
import { Page } from 'playwright';

class PhysicalCardOverview {
  readonly page: Page;
  readonly debitCardPaTable: Locator;
  readonly debitCardStatus: Locator;

  constructor(page: Page) {
    this.page = page;

    this.debitCardPaTable = this.page.getByTestId(
      'physical-cards-overview-title',
    );
    this.debitCardStatus = this.page.getByTestId('card-status-chip');
  }

  async validateDebitCardStatus(cardOverviewTitle: string, status: string) {
    await this.page.waitForLoadState('networkidle');
    const activeCard = this.debitCardStatus.filter({ hasText: status });
    expect(await this.debitCardPaTable.textContent()).toContain(
      cardOverviewTitle,
    );
    expect(await activeCard.textContent()).toContain(status);
  }

  async issueNewVisaDebitCard() {
    try {
      const activeCard = this.debitCardStatus.filter({ hasText: 'Active' });
      await activeCard.waitFor({ state: 'visible' });
      await activeCard.click();

      const issueNewCardButton = this.page.getByRole('button', {
        name: 'Issue new card',
      });
      await issueNewCardButton.waitFor({ state: 'visible' });
      await issueNewCardButton.click();

      for (let i = 0; i < 2; i++) {
        const okButton = this.page.getByRole('button', { name: 'OK' });
        await okButton.waitFor({ state: 'visible' });
        await okButton.click();
      }
    } catch (error) {
      console.error(`Failed to issue new Visa debit card: ${error}`);
    }
  }

  async pauseVisaDebitCard() {
    try {
      const activeCard = this.debitCardStatus.filter({ hasText: 'Active' });
      await activeCard.waitFor({ state: 'visible' });
      await activeCard.click();

      const pauseCardButton = this.page.getByRole('button', {
        name: 'Pause card',
      });
      await pauseCardButton.waitFor({ state: 'visible' });
      await pauseCardButton.click();

      for (let i = 0; i < 2; i++) {
        const okButton = this.page.getByRole('button', { name: 'OK' });
        await okButton.waitFor({ state: 'visible' });
        await okButton.click();
      }
    } catch (error) {
      console.error(`Failed to pause new Visa debit card: ${error}`);
    }
  }

  async unPauseVisaDebitCard() {
    try {
      const activeCard = this.debitCardStatus.filter({ hasText: 'Paused' });
      await activeCard.waitFor({ state: 'visible' });
      await activeCard.click();

      const unPauseCardButton = this.page.getByRole('button', {
        name: 'Unpause card',
      });
      await unPauseCardButton.waitFor({ state: 'visible' });
      await unPauseCardButton.click();

      for (let i = 0; i < 2; i++) {
        const okButton = this.page.getByRole('button', { name: 'OK' });
        await okButton.waitFor({ state: 'visible' });
        await okButton.click();
      }
    } catch (error) {
      console.error(`Failed to unpause new Visa debit card: ${error}`);
    }
  }
}

export default PhysicalCardOverview;
