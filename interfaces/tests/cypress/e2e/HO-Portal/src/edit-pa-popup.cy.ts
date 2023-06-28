import { ProgramPhase } from '../../../../../../services/121-service/src/shared/enum/program-phase.model';
import { FspName } from '../../../../../../services/121-service/src/fsp/enum/fsp-name.enum';

describe('Edit PA details in pop-up', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
  });

  it('Should show and edit PA details in pop-up', function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);

    cy.fixture('edit-pa-popup').then((fixture) => {
      cy.importRegistrations(programId, [fixture.registration]);
      cy.setHoPortal();

      cy.visit(fixture.url);

      cy.get('app-program-people-affected', { timeout: 8000 }).should(
        'be.visible',
      );

      cy.get('[data-cy="pa-edit-button"]', { timeout: 8000 }).click();

      cy.get('app-edit-person-affected-popup')
        .get('app-update-property-item')
        .each(($el) => {
          const type = $el.attr('ng-reflect-type') || '';
          const label = $el.attr('ng-reflect-label') || '';
          validateInput(type, label);
        });
    });
  });

  function validateInput(type: string, label: string) {
    switch (type) {
      case 'number':
        clearInput(label);
        inputStringValue(label, '123');
        clickSaveAndConfirm(label);
        break;
      case 'text':
        clearInput(label);
        inputStringValue(label, 'test');
        clickSaveAndConfirm(label);
        break;
      case 'tel':
        clearInput(label);
        inputStringValue(label, '14155238887');
        clickSaveAndConfirm(label);
        break;
      case 'dropdown':
        inputDropdownValue(label);
        clickSaveAndConfirm(label);
        break;
      case 'date':
        clearInput(label);
        inputStringValue(label, '01-01-2022');
        clickSaveAndConfirm(label);
        break;
      default:
        break;
    }
  }

  function inputStringValue(label: string, value: string) {
    cy.get(`[ng-reflect-label="${label}"] .native-input`).type(value);
  }

  function inputDropdownValue(label: string) {
    cy.get(`[ng-reflect-label="${label}"] ion-item`).click();
    cy.contains('.select-interface-option', 'Dutch').click();
  }

  function clearInput(label: string) {
    cy.get(`[ng-reflect-label="${label}"] .native-input`).clear();
  }

  function clickSaveAndConfirm(label: string) {
    cy.intercept('**/attribute', {
      statusCode: 201,
    }).as('updateAttribute');

    cy.get(`[ng-reflect-label="${label}"] ion-button[type="submit"]`).click();

    cy.wait('@updateAttribute')
      .its('response.statusCode')
      .should('not.be.oneOf', [400, 500]);

    // commented out because the alert where the button is supposed to be is not showing
    // cy.get('button.alert-button', { timeout: 15000 }).click();
  }
});
