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
  initializePayment(
    resetScript,
    resetIdentifier,
    programId,
    registration,
    duplicateNumber,
    maxRetryDuration,
    minPassRatePercentage,
    amount,
  ) {
    // reset db
    resetPage.resetDB(resetScript, resetIdentifier);
    // login
    loginPage.login();
    // Upload registration
    registrationsPage.importRegistrations(programId, registration);
    // Duplicate registration to be more then 100k
    resetPage.duplicateRegistrations(duplicateNumber);
    // Change status of all PAs to included and check response
    programsPage.updateRegistrationStatusAndLog(programId, 'included');
    // Create payment only if dry run is successful
    paymentsPage.verifyPaymentDryRunUntilSuccess(programId, amount);
    const doPaymentResult = paymentsPage.createPayment(programId, amount);
    const paymentId = JSON.parse(doPaymentResult.body).id;
    // Monitor that 10% of payments is successful and then stop the test
    return paymentsPage.getPaymentResults(
      programId,
      maxRetryDuration,
      paymentId,
      duplicateNumber,
      minPassRatePercentage,
    );
  }
}
