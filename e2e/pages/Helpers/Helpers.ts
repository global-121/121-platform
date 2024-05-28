import { Page } from 'playwright';
import { expect } from 'playwright/test';

class Helpers {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  static async getTodaysDate(): Promise<string> {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  async takeFullScreenShot({ fileName }: { fileName: string }) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    // await this.page.screenshot({ path: `screenshots/${fileName}.png` });
    await expect(this.page).toHaveScreenshot(`${fileName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  }

  async takePartialScreenshot({
    elementId,
    fileName,
  }: {
    elementId: string;
    fileName: string;
  }) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    const element = this.page.getByTestId(elementId);
    // await element.screenshot({ path: `screenshots/${fileName}.png` });
    await expect(element).toHaveScreenshot(`${fileName}.png`, {
      animations: 'disabled',
    });
  }
}

export default Helpers;
