import { ProgramPhase } from '../../../../../../services/121-service/src/shared/enum/program-phase.model';

const programId = 1;

describe('Registration phase', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
  });

  it('should import a CSV with a variety of language strings', function () {
    cy.fixture('pa-import').then((fixture) => {
      cy.setHoPortal();
      cy.visit(fixture.url);
      cy.intercept(
        'POST',
        `*/programs/${programId}/registrations/import-bulk`,
        {
          statusCode: 201,
        },
      ).as('import');
      cy.get('[data-cy="import-as-imported"]').click();
      cy.get('[data-cy="file-picker-input"]')
        .get('input[type=file]')
        .selectFile('cypress/fixtures/test-import-pa-languages.csv');
      cy.get('[data-cy="file-picker-confirm-button"]').click();
      cy.wait('@import');
      // Work in progress in the next lines of code should be a check to see if uploading the pa was succesful
    });
  });
});
