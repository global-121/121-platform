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
      expect(iframe.length).toBe(1);
    } else {
      expect(iframe.length).toBe(0);
      await expect(this.monitoringIframe).toContainText(
        'No PowerBI dashboard has been configured for this project, please contact support@121.global to set this up',
      );
    }
  }

  async assertValuesInMonitoringTab({
    peopleRegistered,
    peopleIncluded,
    lastPaymentAmount,
    remainingBudget,
    cashDisbursed,
    paymentsDone,
    newRegistrations,
  }: {
    peopleRegistered: number;
    peopleIncluded: number;
    lastPaymentAmount?: string;
    remainingBudget: string;
    cashDisbursed: string;
    paymentsDone: number;
    newRegistrations?: number;
  }) {
    const registrationsTileLocator = this.peopleRegisteredTile.getByTestId(
      'metric-tile-component',
    );
    const includedTileLocator = this.peopleIncludedTile.getByTestId(
      'metric-tile-component',
    );
    const remainingBudgetTileLocator = this.remainingBudgetTile.getByTestId(
      'metric-tile-component',
    );
    const cashDisbursedTileLocator = this.cashDisbursedTile.getByTestId(
      'metric-tile-component',
    );
    const paymentsDoneChip = this.remainingBudgetTile.getByLabel(
      `${paymentsDone.toString()} payment(s) done`,
    );
    const newPeopleRegisteredChip = this.peopleRegisteredTile.getByLabel(
      `${newRegistrations} new`,
    );
    // Validate metrics "Chips"
    if (lastPaymentAmount) {
      const cashDisbursedInLastPayment = this.cashDisbursedTile.getByLabel(
        `+ ${lastPaymentAmount}`,
      );
      await expect(cashDisbursedInLastPayment).toContainText(
        lastPaymentAmount ?? '',
      );
    }
    if (newRegistrations) {
      await expect(newPeopleRegisteredChip).toHaveText(
        `${newRegistrations.toString()} new`,
      );
    }
    await expect(paymentsDoneChip).toHaveText(
      `${paymentsDone.toString()} payment(s) done`,
    );
    // Validate metrics values
    await expect(registrationsTileLocator).toHaveText(
      peopleRegistered.toString(),
    );
    await expect(includedTileLocator).toHaveText(peopleIncluded.toString());
    await expect(remainingBudgetTileLocator).toHaveText(
      remainingBudget.toString(),
    );
    await expect(cashDisbursedTileLocator).toHaveText(cashDisbursed.toString());
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

  // Charts assertions only registrations per status are checked by string because the chart is responsive
  // And if we would like to check every possible status it make the assertion very complicated
  async assertDashboardCharts({
    regPerStatus,
    regPerDuplicateStatus,
    regByCreationDate,
    transfersPerPaymentStatus,
    amountPerPaymentStatus,
    amountPerMonth,
  }: {
    regPerStatus: string;
    regPerDuplicateStatus: {
      duplicate: number;
      unique: number;
    };
    regByCreationDate: string;
    transfersPerPaymentStatus: {
      date: string;
      failed: number;
      successful: number;
      processing: number;
      pendingApproval: number;
      approved: number;
    };
    amountPerPaymentStatus: {
      date: string;
      failed: number;
      successful: number;
      processing: number;
      pendingApproval: number;
      approved: number;
    };
    amountPerMonth: {
      date: string;
      failed: number;
      successful: number;
      processing: number;
      pendingApproval: number;
      approved: number;
    };
  }) {
    const barChartCanvas = this.page.locator('p-chart[type="bar"]');
    const lineChartCanvas = this.page.locator('p-chart[type="line"]');
    // Selectors for each chart type
    const registrationsPerStatus = barChartCanvas.getByLabel(
      `Registrations per status ${regPerStatus}`,
    );
    const registrationsPerDuplicateStatus = barChartCanvas.getByLabel(
      `Registrations per duplicate status Duplicate: ${regPerDuplicateStatus.duplicate} Unique: ${regPerDuplicateStatus.unique}`,
    );
    const registrationsByCreationDate = lineChartCanvas.getByLabel(
      `Registrations by creation date (last 2 weeks) ${regByCreationDate}`,
    );

    const transfersPerPayment = barChartCanvas.getByLabel(
      `Transfers per payment ${transfersPerPaymentStatus.date}: Successful: ${transfersPerPaymentStatus.successful.toString()}, Pending: ${transfersPerPaymentStatus.pending.toString()}`,
    );
    const amountSentPerPayment = barChartCanvas.getByLabel(
      `Amount sent per payment ${amountPerPaymentStatus.date}: Successful: ${amountPerPaymentStatus.successful.toString()}, Pending: ${amountPerPaymentStatus.pending.toString()}`,
    );
    const amountSentPerMonth = barChartCanvas.getByLabel(
      `Amount sent per month ${amountPerMonth.date}: Successful: ${amountPerMonth.successful.toString()}, Pending: ${amountPerMonth.pending.toString()}`,
    );
    // Validate charts data
    await expect(registrationsPerStatus).toBeVisible();
    await expect(registrationsPerDuplicateStatus).toBeVisible();
    await expect(registrationsByCreationDate).toBeVisible();
    await expect(transfersPerPayment).toBeVisible();
    await expect(amountSentPerPayment).toBeVisible();
    await expect(amountSentPerMonth).toBeVisible();
  }
}

export default ProjectMonitoring;
