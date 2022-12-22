import portalEn from "../../../../../../interfaces/HO-Portal/src/assets/i18n/en.json";
import { ProgramPhase } from "../../../../../../services/121-service/src/shared/enum/program-phase.model";
import programLVV from "../../../../../../services/121-service/seed-data/program/program-pilot-nl.json";

describe("Payment phase", () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
  });

  it('"Do payment #1" without included PAs', function () {
    cy.importRegistrations(1);
    cy.moveToSpecifiedPhase(1, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(1, ProgramPhase.payment);
    cy.fixture("payment").then((page) => {
      cy.setHoPortal();
      cy.visit(page.url);
      cy.url().should("include", "payment");
      cy.get(
        ".ion-justify-content-between > :nth-child(1) > ion-row.md > .styled-select"
      ).select("Do payment #1");
      cy.get("#alert-1-msg").contains("no People");
    });
  });

  it('"Do payment #1" with 1 included PA', function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    let arr = [];
    cy.getAllPeopleAffected(programId).then((response) => {
      for (const pa of response.body) {
        arr.push(pa.referenceId);
      }
      cy.includePeopleAffected(programId, arr);
    });
    cy.fixture("payment").then((page) => {
      cy.setHoPortal();
      cy.visit(page.url);
      cy.url().should("include", "payment");
      cy.get(
        ".ion-justify-content-between > :nth-child(1) > ion-row.md > .styled-select"
      ).select(
        `${portalEn.page.program["program-people-affected"].actions["do-payment"]} #${page.payment}`
      );
      cy.get("label > input").click();
      cy.get('[data-cy="apply-action"]').click();
      cy.get(
        "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
      ).click();
      cy.get(".buttons-last-slot > .ion-color-primary").click();
      cy.get("#alert-3-msg").contains("Successfully");
      cy.get("#alert-3-msg").contains(String(arr.length));
      cy.get(".alert-button").click();
      cy.get('[data-cy="payment-history-button"]').contains(
        portalEn.page.program["program-people-affected"].transaction.success
      );
      cy.get('[data-cy="payment-history-button"]').click();
      cy.get(".full-width > :nth-child(1)").contains(
        `${portalEn.page.program["program-people-affected"].transaction["payment-number"]}${page.payment}`
      );
      cy.get(".full-width > :nth-child(1)").contains(
        portalEn.page.program["program-payout"]["last-payment"].success
      );
    });
  });

  it("Show total amount", function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
    cy.importRegistrations(programId);
    let arr = [];
    let registrations = [];
    cy.getAllPeopleAffected(programId).then((response) => {
      for (const pa of response.body) {
        arr.push(pa.referenceId);
        registrations.push(pa);
      }
      cy.includePeopleAffected(programId, arr);
    });
    cy.fixture("payment").then((page) => {
      cy.setHoPortal();
      cy.visit(page.url);
      cy.url().should("include", "payment");
      cy.get(
        ".ion-justify-content-between > :nth-child(1) > ion-row.md > .styled-select"
      ).select(
        `${portalEn.page.program["program-people-affected"].actions["do-payment"]} #${page.payment}`
      );
      cy.get("label > input").click();
      cy.get('[data-cy="apply-action"]').click();
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

  // it('Send payment instructions with changed transfer value', function () {
  //   const programId = 1;
  //   cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
  //   cy.moveToSpecifiedPhase(programId, ProgramPhase.payment);
  //   cy.importRegistrations(programId);
  //   let arr = [];
  //   cy.getAllPeopleAffected(programId).then((response) => {
  //     for (const pa of response.body) {
  //       arr.push(pa.referenceId);
  //     }
  //     cy.includePeopleAffected(programId, arr);
  //   });
  //   cy.fixture("payment").then((page) => {
  //     cy.setHoPortal();
  //     cy.visit(page.url);
  //     cy.url().should("include", "payment");
  //     cy.get(
  //       ".ion-justify-content-between > :nth-child(1) > ion-row.md > .styled-select"
  //     ).select(
  //       `${portalEn.page.program["program-people-affected"].actions["do-payment"]} #${page.payment}`
  //     );
  //     cy.get("label > input").click();
  //     cy.get('[data-cy="apply-action"]').click();

  //     // Use this to change transfer amount
  //     cy.get('[data-cy="transfer-value-input"]');

  //     cy.get(
  //       "app-make-payment > .ion-align-items-center > confirm-prompt > .md"
  //     ).click();
  //     cy.get(".buttons-last-slot > .ion-color-primary").click();
  //     cy.get("#alert-3-msg").contains("Successfully");
  //     cy.get("#alert-3-msg").contains(String(arr.length));
  //     cy.get(".alert-button").click();
  //     cy.get('[data-cy="payment-history-button"]').contains(
  //       portalEn.page.program["program-people-affected"].transaction.success
  //     );
  //     cy.get('[data-cy="payment-history-button"]').click();
  //     cy.get(".full-width > :nth-child(1)").contains(
  //       `${portalEn.page.program["program-people-affected"].transaction["payment-number"]}${page.payment}`
  //     );
  //     cy.get(".full-width > :nth-child(1)").contains(
  //       portalEn.page.program["program-payout"]["last-payment"].success
  //     );
  //   });
  // });
});
