import portalEn from "../../../../../../interfaces/HO-Portal/src/assets/i18n/en.json";
import { ProgramPhase } from "../../../../../../services/121-service/src/shared/enum/program-phase.model";
import programLVV from "../../../../../../services/121-service/seed-data/program/program-pilot-nl.json";

describe("'Do Payment #1' bulk action", () => {
  beforeEach(() => {
    cy.wait(4000);
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
  });

  it(`should show a 'no people' alert when no included PAs`,
    {
      retries: {
        openMode: 1,
      },
    },
   function () {
    const programId = 1;
    cy.importRegistrations(programId);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.fixture("payment").then((page) => {
      selectPaymentAction(page, page.payment);
      cy.get("#alert-1-msg").contains("no People");
    });
  });

  it(`should show a 'success' confirmation for 1 included PAs`, function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    const [arr,registrations] = includeAllRegistrations(programId);
    
    cy.fixture("payment").then((page) => {
      selectPaymentAction(page, page.payment);
      selectPaAndApply();
      cy.get(
        "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
      ).click();
      cy.get(".buttons-last-slot > .ion-color-primary").click();
      cy.get("#alert-3-msg").contains("Successfully");
      cy.get("#alert-3-msg").contains(String(arr.length));
      cy.wait(2000);
      cy.get(".alert-button").click();
      cy.get('[data-cy="payment-history-button"]').contains(
        portalEn.page.program["program-people-affected"].transaction.success
      );
      cy.get('[data-cy="payment-history-button"]').click({force: true});
      cy.get(".full-width > :nth-child(1)").contains(
        `${portalEn.page.program["program-people-affected"].transaction["payment-number"]}${page.payment}`
      );
      cy.get(".full-width > :nth-child(1)").contains(
        portalEn.page.program["program-payout"]["last-payment"].success
      );
    });
  });

  it(`should update a PA's status with 'max payments = 1' to 'completed' after doing 1 payment`, function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    cy.fixture("registration-nlrc-max-payment").then((registrationMaxPayment) => {
      cy.importRegistrations(1, [registrationMaxPayment]);
      const [arr,registrations] = includeAllRegistrations(programId);
      cy.fixture("payment").then((page) => {
        selectPaymentAction(page, page.payment);
        selectPaAndApply();
        cy.get(
          "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
        ).click();
        cy.get(".buttons-last-slot > .ion-color-primary").click();
        cy.get("#alert-3-msg").contains("Successfully");
        cy.get("#alert-3-msg").contains(String(arr.length));
        cy.wait(2000);
        cy.get(".alert-button").click();
        cy.get('[data-cy="payment-history-button"]').contains(
          portalEn.page.program["program-people-affected"].transaction.success
          );
        cy.wait(2000);
        cy.get('.datatable-body-cell-label > span').contains(portalEn.page.program["program-people-affected"].status.completed)
      });
    });
  });

  it(`should show the correct total transfer amount`, function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    const [arr,registrations] = includeAllRegistrations(programId);
    cy.fixture("payment").then((page) => {
      selectPaymentAction(page, page.payment);
      selectPaAndApply();
      cy.get(
        "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
      ).click();
      const sum = registrations.reduce(function (a, b) {
        return a + (b["paymentAmountMultiplier"] || 1);
      }, 0);
      const amountToCheck = programLVV.fixedTransferValue * sum;
      cy.get(".ion-padding > .ion-margin-vertical").contains(
        String(amountToCheck)
      );
    });
  });

  it(`should show the correct total transfer amount after changing the transfer value`, function () {
    const programId = 1;
    const newFixedTransferValue = 4;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    const [arr,registrations] = includeAllRegistrations(programId);
    cy.fixture("payment").then((page) => {
      selectPaymentAction(page, page.payment);
      selectPaAndApply();
      cy.get('[data-cy="transfer-value-input"]').clear();
      cy.get('[data-cy="transfer-value-input"]').find('input').type(String(newFixedTransferValue), {force: true});
      cy.get(
        "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
      ).click();
      const sum = registrations.reduce(function (a, b) {
        return a + (b["paymentAmountMultiplier"] || 1);
      }, 0);
      const amountToCheck = newFixedTransferValue * sum;
      cy.get(".ion-padding > .ion-margin-vertical").contains(
        String(amountToCheck)
      );
    });
  });

  it(`should not be able to do a payment for a 'completed' PA`, function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    cy.fixture("registration-nlrc-max-payment").then((registrationMaxPayment) => {
      cy.importRegistrations(1, [registrationMaxPayment]);
      const [arr,registrations] = includeAllRegistrations(programId);
      cy.fixture("payment").then((page) => {
        selectPaymentAction(page, page.payment);
        selectPaAndApply();
        cy.get(
          "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
        ).click();
        cy.get(".buttons-last-slot > .ion-color-primary").click();
        cy.get("#alert-3-msg").contains("Successfully");
        cy.get("#alert-3-msg").contains(String(arr.length));
        cy.wait(2000);
        cy.get(".alert-button").click();
        cy.get('[data-cy="payment-history-button"]').contains(
          portalEn.page.program["program-people-affected"].transaction.success
        );
        cy.wait(2000);
        cy.get('.datatable-body-cell-label > span').contains(portalEn.page.program["program-people-affected"].status.completed);
        selectPaymentAction(page, page.nextPayment);
        cy.get(".datatable-body-cell-label > input").click().should('length', 1);
      });
    });
  });

  it(`should not be able to move a PA back to 'included' when max payments = payments done`, function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    cy.fixture("registration-nlrc-max-payment").then((registrationMaxPayment) => {
      cy.importRegistrations(1, [registrationMaxPayment]);
      const [arr,registrations] = includeAllRegistrations(programId);
      cy.fixture("payment").then((page) => {
        selectPaymentAction(page, page.payment);
        selectPaAndApply();
        cy.get(
          "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
        ).click();
        cy.get(".buttons-last-slot > .ion-color-primary").click();
        cy.get("#alert-3-msg").contains("Successfully");
        cy.get("#alert-3-msg").contains(String(arr.length));
        cy.wait(2000);
        cy.get(".alert-button").click();
        cy.get('[data-cy="payment-history-button"]').contains(
          portalEn.page.program["program-people-affected"].transaction.success
        );
        cy.wait(2000);
        cy.get('.datatable-body-cell-label > span').contains(portalEn.page.program["program-people-affected"].status.completed);
        cy.get('[data-cy="select-action"]')
        .select(
          `${portalEn.page.program["program-people-affected"].actions['include']}`
        );
        cy.get("#alert-1-msg").contains("no People");
      });
    });
  });

  const selectPaymentAction = (fixture: any, payment: number) => {
    cy.setHoPortal();
    cy.visit(fixture.url);
    cy.url().should("include", "payment");
    cy.get('[data-cy="select-action"]')
    .select(
      `${portalEn.page.program["program-people-affected"].actions["do-payment"]} #${payment}`
    );
  }

  const selectPaAndApply = () => {
    cy.get("label > input").click();
    cy.get('[data-cy="apply-action"]').click();
  }

  const includeAllRegistrations = (programId: number) => {
    let arr = [];
    let registrations = [];
    cy.getAllPeopleAffected(programId).then((response) => {
      for (const pa of response.body) {
        arr.push(pa.referenceId);
        registrations.push(pa);
      }
      cy.includePeopleAffected(programId, arr);
    });
    return [arr, registrations];
  }

  
});
