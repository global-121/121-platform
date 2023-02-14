/// <reference types="cy-verify-downloads" />
import { ProgramPhase } from '../../../../../../services/121-service/src/shared/enum/program-phase.model';

const programId = 1;

describe('Registration phase', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
  });
  afterEach(() => {
    // eslint-disable-next-line cypress/no-unnecessary-waiting -- Wait for the Twilio-mock to fake an incoming status callback
    cy.wait(4000);
  });

  it('Export full PA list with 1 PA with 2 payments', function () {
    cy.importRegistrations(programId);
    const arr: string[] = [];
    cy.getAllPeopleAffected(programId).then((response) => {
      for (const pa of response.body) {
        arr.push(pa.referenceId);
      }
      cy.includePeopleAffected(programId, arr);
      cy.doPayment(programId, arr, 1, 10);
      cy.doPayment(programId, arr, 2, 10);
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting -- Wait for the Twilio-mock to fake an incoming message
    cy.wait(4000);
    cy.fixture('pa-export').then((page) => {
      cy.setHoPortal();
      cy.visit(page.url);
      cy.get('[data-cy="export-list-all-pa"]').click();
      cy.get('[data-cy="input-prompt-confirm"]').click();
      cy.verifyDownload('.xlsx', { contains: true });
      const date = new Date();
      const filename = `all-people-affected-${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}.xlsx`;
      cy.verifyDownload(filename, { contains: true });
      cy.fixture('registration-nlrc').then((seededRegistration) => {
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
            expect(excelRow).to.have.any.keys(
              'registeredDate',
              'inclusionDate',
            );
            expect(String(excelRow['registeredDate'])).to.include(dateString);
            expect(String(excelRow['inclusionDate'])).to.include(dateString);

            // Checks if read excel contains payments data
            const paymentNumbers = [1, 2];
            for (const payment of paymentNumbers) {
              const keyPaymentAmount = `payment${payment}_amount`;
              expect(String(excelRow[keyPaymentAmount])).to.equal(String(10));
              const keyPaymentDate = `payment${payment}_date`;
              expect(String(excelRow[keyPaymentDate])).to.include(dateString);
              const keyPaymentVoucherClaimed = `payment${payment}_voucherClaimed_date`;
              expect(String(excelRow[keyPaymentVoucherClaimed])).to.include(
                dateString,
              );
            }
          }
        });
      });
    });
  });

  it('Export current PA table view after filtering', function () {
    cy.importRegistrations(programId);
    cy.importRegistrations(programId);
    // eslint-disable-next-line cypress/no-unnecessary-waiting -- Wait for the Twilio-mock to fake an incoming message
    cy.wait(2000);
    cy.fixture('pa-export').then((page) => {
      cy.setHoPortal();
      cy.visit(page.url);
      cy.get('[data-cy="table-text-filter"]').type('PA #1');
      // eslint-disable-next-line cypress/no-unnecessary-waiting -- Wait for filtering to take effect
      cy.wait(2000);
      cy.get('[data-cy="export-table-view"]').click();
      const date = new Date();
      const filename = `registrationValidation-table-${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}.xlsx`;
      cy.verifyDownload(filename, { contains: true });
      cy.readXlsx(filename, 'data').then((excelData) => {
        expect(excelData.length).to.equal(1);
      });
    });
  });

  it('Export current PA table view without records after filtering', function () {
    cy.importRegistrations(programId);
    cy.importRegistrations(programId);
    // eslint-disable-next-line cypress/no-unnecessary-waiting -- Wait for the Twilio-mock to fake an incoming message
    cy.wait(2000);
    cy.fixture('pa-export').then((page) => {
      cy.setHoPortal();
      cy.visit(page.url);
      cy.get('[data-cy="table-text-filter"]').type('PA #3');
      // eslint-disable-next-line cypress/no-unnecessary-waiting -- Wait for filtering to take effect
      cy.wait(2000);
      cy.get('[data-cy="export-table-view"]').should(
        'have.class',
        'button-disabled',
      );
    });
  });
});
