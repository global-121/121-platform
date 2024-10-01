import { expect } from '@playwright/test';
import { Locator, Page } from 'playwright';

import BasePage from './BasePage';

class ProjectMonitoring extends BasePage {
  page: Page;
  readonly peopleRegisteredTile: Locator;
  readonly peopleIncludedTile: Locator;
  readonly remainingBudgetTile: Locator;
  readonly cashDisbursedTile: Locator;
  readonly projectDescriptionTile: Locator;
  readonly metricTileComponent: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.peopleRegisteredTile = this.page.getByTestId(
      'metric-people-registered',
    );
    this.peopleIncludedTile = this.page.getByTestId('metric-people-included');
    this.remainingBudgetTile = this.page.getByTestId('metric-remaining-budget');
    this.cashDisbursedTile = this.page.getByTestId('metric-cash-disbursed');
    this.projectDescriptionTile = this.page.getByTestId(
      'metric-project-description',
    );
    this.metricTileComponent = this.page.getByTestId('metric-tile-component');
  }

  async assertMonitoringTabElements() {
    await expect(this.peopleRegisteredTile).toContainText('People registered');
    await expect(this.peopleIncludedTile).toContainText('People included');
    await expect(this.remainingBudgetTile).toContainText('Remaining budget');
    await expect(this.cashDisbursedTile).toContainText('Cash disbursed');
    await expect(this.projectDescriptionTile).toContainText(
      'Project description',
    );

    // For the moment we are not checking the iframe area because there are no visible elemnts in it
  }

  async assertValuesInMonitoringTab({
    peopleRegistered,
    peopleIncluded,
  }: {
    peopleRegistered: number;
    peopleIncluded: number;
  }) {
    const registrationsTileLocator = this.peopleRegisteredTile.getByTestId(
      'metric-tile-component',
    );
    const includedTileLocator = this.peopleIncludedTile.getByTestId(
      'metric-tile-component',
    );

    await expect(registrationsTileLocator).toHaveText(
      peopleRegistered.toString(),
    );
    await expect(includedTileLocator).toHaveText(peopleIncluded.toString());
  }
}

export default ProjectMonitoring;
