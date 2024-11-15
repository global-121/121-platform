import loginModel from '../models/login.js';
import paymentsModel from '../models/payments.js';
import ProgramsModel from '../models/programs.js';
import RegistrationsModel from '../models/registrations.js';
import resetModel from '../models/reset.js';

const paymentsPage = new paymentsModel();
const resetPage = new resetModel();
const loginPage = new loginModel();
const registrationsPage = new RegistrationsModel();
const programsPage = new ProgramsModel();

export default class InitializePaymentModel {
  constructor() {}

  initializePayment(
    resetScript,
    programId,
    registration,
    duplicateNumber,
    paymentId,
    maxTimeoutAttempts,
    minPassRatePercentage,
  ) {
    // reset db
    resetPage.resetDB(resetScript);
    // login
    loginPage.login();
    // Upload registration
    registrationsPage.importRegistrations(programId, registration);
    // Duplicate registration to be more then 100k
    resetPage.duplicateRegistrations(duplicateNumber);
    // Change status of all PAs to included and check response
    programsPage.updateRegistrationStatusAndLog(programId, 'included');

    paymentsPage.createPayment(programId);
    // Monitor that 10% of payments is successful and then stop the test
    return paymentsPage.getPaymentResults(
      programId,
      maxTimeoutAttempts,
      paymentId,
      duplicateNumber,
      minPassRatePercentage,
    );
  }
}
