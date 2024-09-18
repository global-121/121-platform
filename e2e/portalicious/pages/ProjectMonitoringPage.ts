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
  readonly iframeArea: Locator;

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
    this.iframeArea = this.page.getByTestId('display-area');
  }

  async assertMonitoringTabElements() {
    const registrationsTileLocator = this.peopleRegisteredTile;
    const includedTileLocator = this.peopleIncludedTile;
    const remainingBudgetTileLocator = this.remainingBudgetTile;
    const cashDisbursedTileLocator = this.cashDisbursedTile;
    const projectDescriptionTileLocator = this.projectDescriptionTile;
    const iframeAreaLocator = this.iframeArea;

    const registrationTileText = await registrationsTileLocator.innerText();
    const includedTileText = await includedTileLocator.innerText();
    const remainingBudgetTileText =
      await remainingBudgetTileLocator.innerText();
    const cashDisbursedTileText = await cashDisbursedTileLocator.innerText();
    const projectDescriptionTileText =
      await projectDescriptionTileLocator.innerText();
    const iframeAreaLocatorText = await iframeAreaLocator.innerText();

    expect(registrationTileText).toContain('People registered');
    expect(includedTileText).toContain('People included');
    expect(remainingBudgetTileText).toContain('Remaining budget');
    expect(cashDisbursedTileText).toContain('Cash disbursed');
    expect(projectDescriptionTileText).toContain('Project description');
    console.log(iframeAreaLocatorText);
    expect(iframeAreaLocatorText).toContain('Cash Operational Monitoring');
  }
}

export default ProjectMonitoring;
