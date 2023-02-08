import { ProgramPhase } from '../../../../../../services/121-service/src/shared/enum/program-phase.model';
import { FspName } from '../../../../../../services/121-service/src/fsp/enum/fsp-name.enum';

describe('Edit person affect pop-up', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
  });

  it('Should edit person affect in pop-up', function () {
    const programId = 1;
    cy.moveToSpecifiedPhase(programId, ProgramPhase.registrationValidation);
    cy.fixture('edit-pa-popup').then((fixture) => {
      cy.importRegistrations(programId, [fixture.registration]);
      cy.setHoPortal();
      cy.visit(fixture.url);
      cy.get('#edit-button').as('btn').click();

      cy.wait(300);

      cy.get('app-update-property-item').each(($el) => {
        const el = $el[0];
        const type = el.attributes.getNamedItem('ng-reflect-type')?.textContent;
        const label =
          el.attributes.getNamedItem('ng-reflect-label')?.textContent;
        validateInput(type, label);
      });

      cy.get('app-update-fsp').click();
      cy.contains(
        '.select-interface-option',
        FspName.intersolveNoWhatsapp,
      ).click();
      clickSaveAndConfirm('Financial Service Provider');
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
    cy.intercept('**/attribute').as('updateAttribute');
    cy.get(`[ng-reflect-label="${label}"] ion-button`).click();
    cy.wait('@updateAttribute')
      .its('response.statusCode')
      .should('not.be.oneOf', [400, 500]);
    cy.get('.alert-button').click();
    cy.wait(100);
  }
});
