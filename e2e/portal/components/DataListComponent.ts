import { Locator } from '@playwright/test';

class DataListComponent {
  readonly datalist: Locator;

  constructor(locator: Locator) {
    // Works lazily, only gets the data when getData is called.
    this.datalist = locator;
  }

  async getData() {
    await this.datalist.waitFor({ state: 'visible' });
    const unParsed = await this.datalist
      .locator('div[data-testid-category=data-list-item]')
      .allTextContents();
    const parsed: Record<string, string> = {};
    unParsed.forEach((element) => {
      if ((element.match(/:/g) ?? []).length > 1) {
        throw new Error(
          "Field or value contains a colon character, please use test data that doesn't.",
        );
      }
      let [key, value] = element.split(':') as [string, string];
      key = key.trim();
      value = value.trim();
      parsed[key] = value;
    });
    return parsed;
  }
}

export default DataListComponent;
