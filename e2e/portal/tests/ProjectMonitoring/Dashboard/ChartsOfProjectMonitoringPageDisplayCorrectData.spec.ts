import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

const currentDate = new Date();
const registrationByCreationDate = format(currentDate, 'yyyy-MM-dd');
const formattedDate = format(currentDate, 'dd/MM/yyyy');
const formattedMonth = format(currentDate, 'yyyy-MM');

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[30579] All Charts of Monitoring Dashboard tab display correct data', async ({
  page,
}) => {
  const projectMonitoring = new ProjectMonitoring(page);

  const projectTitle = 'NLRC OCW program';

  await test.step('Navigate to project`s monitoring page', async () => {
    await projectMonitoring.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
    await projectMonitoring.selectTab({ tabName: 'Dashboard' });
  });

  await test.step('Check if all elements of Dashboard are displayed', async () => {
    await projectMonitoring.assertDashboardCharts({
      regPerStatus: 'Included: 5',
      regPerDuplicateStatus: {
        duplicate: 2,
        unique: 3,
      },
      regByCreationDate: `${registrationByCreationDate}: 5`,
      transfersPerPaymentStatus: {
        date: formattedDate,
        failed: 0,
        successful: 4,
        pending: 1,
        pendingApproval: 0,
        approved: 0,
      },
      amountPerPayentStatus: {
        date: formattedDate,
        failed: 0,
        successful: 140,
        pending: 60,
        pendingApproval: 0,
        approved: 0,
      },
      amountPerMonth: {
        date: formattedMonth,
        failed: 0,
        successful: 140,
        pending: 60,
        pendingApproval: 0,
        approved: 0,
      },
    });
  });
});
