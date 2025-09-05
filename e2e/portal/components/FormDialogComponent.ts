import { Locator } from '@playwright/test';

class FormDialogComponent {
  readonly dialog: Locator;

  constructor(dialog: Locator) {
    this.dialog = dialog;
  }

  async waitForVisible(timeout = 5000): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout });
  }

  async getHeader(): Promise<string> {
    const header = this.dialog.locator('h3');
    await header.waitFor({ state: 'visible' });
    return (await header.textContent())?.trim() ?? '';
  }

  async hasIcon(iconClass: string): Promise<boolean> {
    const icon = this.dialog.locator(`i.${iconClass}`);
    return await icon.isVisible();
  }

  async hasContent(text: string): Promise<boolean> {
    return await this.dialog.getByText(text, { exact: false }).isVisible();
  }

  async getButton(name: string): Promise<Locator> {
    return this.dialog.getByRole('button', { name });
  }

  async clickButton(name: string): Promise<void> {
    const button = await this.getButton(name);
    await button.click();
  }

  async confirm(actionLabel = 'Proceed'): Promise<void> {
    await this.clickButton(actionLabel);
    await this.dialog.page().waitForSelector('.p-dialog', {
      state: 'detached',
      timeout: 5000,
    });
  }
}

export default FormDialogComponent;
