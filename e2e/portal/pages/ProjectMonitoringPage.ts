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
  readonly monitoringIframe: Locator;
  readonly importFileButton: Locator;
  readonly uploadFileButton: Locator;
  readonly formError: Locator;

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
    this.monitoringIframe = this.page.getByTestId('monitoring-iframe');
    this.importFileButton = this.page.getByRole('button', {
      name: 'Import file',
    });
    this.uploadFileButton = this.page.getByRole('button', {
      name: 'Upload file',
    });
    this.formError = this.page.getByTestId('form-error');
  }

  async assertMonitoringTabElements({
    shouldHaveIframe,
  }: {
    shouldHaveIframe: boolean;
  }) {
    await expect(this.peopleRegisteredTile).toContainText('People registered');
    await expect(this.peopleIncludedTile).toContainText('People included');
    await expect(this.remainingBudgetTile).toContainText('Remaining budget');
    await expect(this.cashDisbursedTile).toContainText('Cash disbursed');
    await expect(this.projectDescriptionTile).toContainText(
      'Project description',
    );

    const iframe = await this.monitoringIframe.locator('iframe').all();
    if (shouldHaveIframe) {
      await expect(iframe.length).toBe(1);
    } else {
      await expect(iframe.length).toBe(0);
      await expect(this.monitoringIframe).toContainText(
        'No PowerBI dashboard has been configured for this project, please contact support@121.global to set this up',
      );
    }
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

  async selectTab({ tabName }: { tabName: string }) {
    const tabLocator = this.page.getByRole('tablist').getByText(tabName);
    await tabLocator.click();
  }

  async uploadAttachment({
    filePath,
    reason,
  }: {
    filePath: string;
    reason: string;
  }) {
    await this.page.waitForLoadState('networkidle');
    await this.uploadFileButton.waitFor({ state: 'visible' });
    await this.uploadFileButton.click();
    await this.chooseAndUploadFile(filePath);
    await this.page
      .getByPlaceholder('Name the file for easy identification')
      .fill(reason);
    await this.importFileButton.click();
  }

  async validateFormError({ errorText }: { errorText: string }): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.formError.waitFor();
    const errorString = await this.formError.textContent();
    expect(await this.formError.isVisible()).toBe(true);
    expect(errorString).toContain(errorText);
  }
}

export default ProjectMonitoring;
