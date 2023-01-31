import programLVV from '../../../../../../services/121-service/seed-data/program/program-pilot-nl.json';
import programPV from '../../../../../../services/121-service/seed-data/program/program-pilot-nl-2.json';
import paEn from '../../../../../PA-App/src/assets/i18n/en.json';

describe('Personal Page', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.setPaApp();
  });

  it('shows all available languages from both published programs', function () {
    cy.publishProgram(1);
    cy.publishProgram(2);
    cy.setPaApp();
    const languagesFromBothPrograms = programLVV.languages.concat(
      programPV.languages,
    );
    cy.fixture('pa-home').then((pa) => {
      cy.visit(pa.portal);
      for (const l of languagesFromBothPrograms) {
        const languageString = paEn.personal['select-language'].language[l];
        cy.get('ion-radio-group').contains(languageString);
      }
    });
  });

  it('shows only English with no published programs', function () {
    const languagesFromBothPrograms = programLVV.languages.concat(
      programPV.languages,
    );
    cy.fixture('pa-home').then((pa) => {
      cy.visit(pa.portal);
      cy.get('ion-radio-group').contains('English');
      for (const l of languagesFromBothPrograms) {
        if (l !== 'en') {
          const languageString = paEn.personal['select-language'].language[l];
          cy.get('ion-radio-group')
            .contains(languageString)
            .should('not.exist');
        }
      }
    });
  });

  it('shows only languages from 1 queried program of 2 published programs (not the other one)', function () {
    cy.publishProgram(1);
    cy.publishProgram(2);
    cy.setPaApp();
    cy.visit(`?programs=2`);
    cy.get('ion-radio-group').contains('English');
    for (const l of programLVV.languages) {
      // Languages not included in LVV but included in PV
      if (l !== 'en' && !programPV.languages.includes(l)) {
        const languageString = paEn.personal['select-language'].language[l];
        cy.get('ion-radio-group').contains(languageString).should('not.exist');
      }
    }
    // Languages included in PV
    for (const l of programPV.languages) {
      const languageString = paEn.personal['select-language'].language[l];
      cy.get('ion-radio-group').contains(languageString);
    }
  });

  it('shows only languages from 1 published program (not the other one)', function () {
    cy.publishProgram(2);
    cy.setPaApp();
    cy.fixture('pa-home').then((pa) => {
      cy.visit(pa.portal);
      cy.get('ion-radio-group').contains('English');
      for (const l of programLVV.languages) {
        // Languages not included in LVV but included in PV
        if (l !== 'en' && !programPV.languages.includes(l)) {
          const languageString = paEn.personal['select-language'].language[l];
          cy.get('ion-radio-group')
            .contains(languageString)
            .should('not.exist');
        }
      }
      // Languages included in PV
      for (const l of programPV.languages) {
        const languageString = paEn.personal['select-language'].language[l];
        cy.get('ion-radio-group').contains(languageString);
      }
    });
  });
});
