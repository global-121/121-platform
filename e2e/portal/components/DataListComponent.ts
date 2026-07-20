import { Locator } from '@playwright/test';

class DataListComponent {
  readonly datalist: Locator;

  constructor(locator: Locator) {
    // Works lazily, only gets the data when getData is called.
    this.datalist = locator;
  }

  async getData({
    omitListItemWithLabel,
  }: { omitListItemWithLabel?: string } = {}) {
    await this.datalist.waitFor({ state: 'visible' });
    const listItems = this.datalist.locator(
      'div[data-testid-category=data-list-item]',
    );

    const unParsed = await listItems.allTextContents();
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

    if (omitListItemWithLabel) {
      delete parsed[omitListItemWithLabel];
    }

    return parsed;
  }
}

export default DataListComponent;
