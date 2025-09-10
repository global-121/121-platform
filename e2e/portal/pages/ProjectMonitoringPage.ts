import { expect } from '@playwright/test';
import { promises as fs } from 'fs';
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
  readonly downloadOption: Locator;
  readonly deleteOption: Locator;
  readonly deleteConfirmationCheckbox: Locator;
  readonly deleteFileButton: Locator;

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
    this.downloadOption = this.page.getByRole('menuitem', { name: 'Download' });
    this.deleteOption = this.page.getByRole('menuitem', { name: 'Delete' });
    this.deleteConfirmationCheckbox = this.page.getByRole('checkbox', {
      name: 'I understand this action can not be undone.',
    });
    this.deleteFileButton = this.page.getByRole('button', {
      name: 'Delete file',
    });
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
    filename,
  }: {
    filePath: string;
    filename: string;
  }) {
    await this.page.waitForLoadState('networkidle');
    await this.uploadFileButton.waitFor({ state: 'visible' });
    await this.uploadFileButton.click();
    await this.chooseAndUploadFile(filePath);
    await this.page
      .getByPlaceholder('Name the file for easy identification')
      .fill(filename);
    await this.importFileButton.click();
  }

  async validateFormError({ errorText }: { errorText: string }) {
    await this.page.waitForLoadState('networkidle');
    await this.formError.waitFor();
    const errorString = await this.formError.textContent();
    expect(await this.formError.isVisible()).toBe(true);
    expect(errorString).toContain(errorText);
  }

  async downloadAttachmentByName({
    fileName,
    snapshotName,
  }: {
    fileName: string;
    snapshotName: string;
  }) {
    await this.page
      .getByRole('row', { name: fileName })
      .locator('button')
      .click();
    const filePath = await this.downloadFile(this.downloadOption.click());
    const fileBuffer = await fs.readFile(filePath);
    expect(fileBuffer).toMatchSnapshot(snapshotName);
  }

  async deleteAttachmentByName({ fileName }: { fileName: string }) {
    await this.page
      .getByRole('row', { name: fileName })
      .locator('button')
      .click();
    await this.deleteOption.click();
    await this.deleteConfirmationCheckbox.click();
    await this.deleteFileButton.click();
  }

  // For now the assertion is very general as we cannot check the type and the data of the charts
  //  Untill we can read the labels of the charts inside the canvas elements this assertion should stay more or less this way
  // Also the titles of the groups of the charts are outside of the div that contains the charts so we cannot check them together
  // Charts are therefore only counted by their types 5 bar charts and 1 line chart = 6 charts in total
  async assertDashboardChartsPresentByType() {
    const barChartCanvas = this.page.locator('p-chart[type="bar"] canvas');
    const lineChartCanvas = this.page.locator('p-chart[type="line"] canvas');
    await expect(barChartCanvas).toHaveCount(5);
    await expect(lineChartCanvas).toHaveCount(1);
  }
}

export default ProjectMonitoring;
