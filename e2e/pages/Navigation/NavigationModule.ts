import { Locator, Page } from 'playwright';

class NavigationModule {
  readonly page: Page;
  readonly programTabNavigationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.programTabNavigationButton = this.page.getByTestId(
      'program-tab-navigation-button',
    );
  }

  async navigateToProgramTab(tabName: string) {
    await this.programTabNavigationButton
      .filter({
        hasText: tabName,
      })
      .click();
  }
}

export default NavigationModule;
