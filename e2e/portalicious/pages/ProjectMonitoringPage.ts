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
    const registrationsTileLocator = this.peopleRegisteredTile;
    const includedTileLocator = this.peopleIncludedTile;
    const remainingBudgetTileLocator = this.remainingBudgetTile;
    const cashDisbursedTileLocator = this.cashDisbursedTile;
    const projectDescriptionTileLocator = this.projectDescriptionTile;

    const registrationTileText = await registrationsTileLocator.innerText();
    const includedTileText = await includedTileLocator.innerText();
    const remainingBudgetTileText =
      await remainingBudgetTileLocator.innerText();
    const cashDisbursedTileText = await cashDisbursedTileLocator.innerText();
    const projectDescriptionTileText =
      await projectDescriptionTileLocator.innerText();

    expect(registrationTileText).toContain('People registered');
    expect(includedTileText).toContain('People included');
    expect(remainingBudgetTileText).toContain('Remaining budget');
    expect(cashDisbursedTileText).toContain('Cash disbursed');
    expect(projectDescriptionTileText).toContain('Project description');

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

    const registrationTileText = await registrationsTileLocator.innerText();
    const includedTileText = await includedTileLocator.innerText();

    expect(registrationTileText).toContain(peopleRegistered.toString());
    expect(includedTileText).toContain(peopleIncluded.toString());
  }
}

export default ProjectMonitoring;
