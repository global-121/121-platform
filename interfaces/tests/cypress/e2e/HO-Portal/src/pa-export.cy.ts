import { ProgramPhase } from "../../../../../../services/121-service/src/shared/enum/program-phase.model";

describe("Registration phase", () => {
  beforeEach(() => {
    const programId = 1;
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
    cy.moveToSpecifiedPhase(1, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(1, ProgramPhase.payment);
    cy.importRegistrations(1);
    let arr = [];
    cy.getAllPeopleAffected(programId).then((response) => {
      for (const pa of response.body) {
        arr.push(pa.referenceId);
      }
      cy.includePeopleAffected(programId, arr);
      cy.doPayment(1, arr, 1, 10);
      cy.doPayment(1, arr, 2, 10);
    });
  });

  it('Export with a PA with 2 payments', function () {
    // Wait for the twilio mock to fake an incomming message
    cy.wait(2000);
    cy.fixture("pa-export").then((page) => {
      cy.setHoPortal();
      cy.visit(page.url);
      cy.get('[data-cy="export-list-all-pa"]').click();
      cy.get(
        '[data-cy="input-prompt-ok"]'
      ).click();
      cy.verifyDownload('.xlsx', { contains: true });
      const date = new Date();
      const filename = `all-people-affected-${date.getFullYear()}-${date.getMonth() + 1
        }-${date.getDate()}.xlsx`;
      cy.verifyDownload(filename, { contains: true });
      cy.fixture("registration-nlrc").then((seededRegistration) => {

        // Checks if read excel contains original seeded values
        cy.readXlsx(filename, 'data').then((excelData) => {
          for (const excelRow of excelData) {
            for (let [key, value] of Object.entries(seededRegistration)) {
              if (key === 'fspName') {
                key = 'financialserviceprovider';
              }
              if (key === 'status') {
                value = 'included';
              }
              expect(String(excelRow[key])).to.equal(String(value));
            }

            // Checks if read excel contains proper status changes
            const dateString = new Date().toISOString().split('T')[0];
            expect(excelRow).to.have.any.keys('registeredDate', 'inclusionDate');
            expect(String(excelRow['registeredDate'])).to.include(dateString);
            expect(String(excelRow['inclusionDate'])).to.include(dateString);

            // Checks if read excel contains payments data
            const paymentNumbers = [1, 2]
            for (const payment of paymentNumbers) {
              const keyPaymentAmount = `payment${payment}_amount`;
              expect(String(excelRow[keyPaymentAmount])).to.equal(String(10));
              const keyPaymentDate = `payment${payment}_date`;
              expect(String(excelRow[keyPaymentDate])).to.include(dateString);
              const keyPaymentVoucherClaimed = `payment${payment}_voucherClaimed_date`;
              expect(String(excelRow[keyPaymentVoucherClaimed])).to.include(dateString);
            }
          }
        });
      });
    });
  });
});
