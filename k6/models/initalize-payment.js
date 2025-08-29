import loginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';
import ProjectsModel from '../models/projects.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const paymentsPage = new paymentsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();
const registrationsPage = new RegistrationsModel();
const projectsPage = new ProjectsModel();

export default class InitializePaymentModel {
  initializePayment(
    resetScript,
    projectId,
    registration,
    duplicateNumber,
    maxTimeoutAttempts,
    minPassRatePercentage,
    amount,
  ) {
    // reset db
    resetPage.resetDB(resetScript);
    // login
    loginPage.login();
    // Upload registration
    registrationsPage.importRegistrations(projectId, registration);
    // Duplicate registration to be more then 100k
    resetPage.duplicateRegistrations(duplicateNumber);
    // Change status of all PAs to included and check response
    projectsPage.updateRegistrationStatusAndLog(projectId, 'included');
    // Create payment
    const doPaymentResult = paymentsPage.createPayment(projectId, amount);
    const paymentId = doPaymentResult.body.id;
    // Monitor that 10% of payments is successful and then stop the test
    return paymentsPage.getPaymentResults(
      projectId,
      maxTimeoutAttempts,
      paymentId,
      duplicateNumber,
      minPassRatePercentage,
    );
  }
}
