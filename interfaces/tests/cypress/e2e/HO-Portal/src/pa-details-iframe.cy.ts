import programLVV from '../../../../../../services/121-service/seed-data/program/program-pilot-nl.json';
import portalEn from '../../../../../../interfaces/HO-Portal/src/assets/i18n/en.json';

describe('PA details iframe page', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginApi();
    cy.loginPortal();
  });

  it('Visits the PA details iframe page and finds 1 PA and checks details', function () {
    cy.importRegistrations(1);

    cy.fixture('pa-details-iframe').then((page) => {
      cy.fixture('registration-nlrc').then((registration) => {
        cy.setHoPortal();

        cy.visit(page.url, {
          qs: {
            phonenumber: registration.phoneNumber,
          },
        });
        cy.url().should('include', 'iframe');
        cy.get('app-recipient-page').should('be.visible');

        cy.get(
          'app-recipient-page *:not(app-recipient-details) ion-label',
        ).contains(registration.nameFirst);
        cy.get(
          'app-recipient-page *:not(app-recipient-details) ion-label',
        ).contains(registration.nameLast);
        cy.get(
          'app-recipient-page *:not(app-recipient-details) ion-label',
        ).contains(programLVV.titlePortal.en);
        cy.get('app-banner').contains(registration.status);
        cy.get('app-recipient-details').contains(registration.phoneNumber);
        cy.get('app-recipient-details').contains(
          registration.whatsappPhoneNumber,
        );
        cy.get('app-recipient-details').contains(
          registration.preferredLanguage,
        );
        cy.get('app-recipient-details').contains(registration.note || '-');
        // Suggestion for future expansion: Check "Status history": timestamps of PA status changes
        cy.get('app-recipient-details').contains(registration.fspName);
        cy.get('app-recipient-details').contains(
          registration.paymentAmountMultiplier,
        );
      });
    });
  });

  it('Visits the PA details iframe page and finds 1 PA on WhatsApp number', function () {
    cy.fixture('registration-nlrc').then((registration) => {
      const whatsappPhoneNumber = 14155238887;
      registration.whatsappPhoneNumber = whatsappPhoneNumber;
      cy.importRegistrations(1, [registration]);

      cy.fixture('pa-details-iframe').then((page) => {
        cy.setHoPortal();

        cy.visit(page.url, {
          qs: {
            phonenumber: whatsappPhoneNumber,
          },
        });
        cy.url().should('include', 'iframe');
        cy.get('app-recipient-page').should('be.visible');

        cy.get('app-recipient-page ion-label').contains(registration.nameFirst);
        cy.get('app-recipient-page ion-label').contains(registration.nameLast);
        cy.get('app-recipient-page ion-label').contains(
          programLVV.titlePortal.en,
        );
      });
    });
  });

  it('Visits the PA details iframe page and finds 2 PAs in 2 different programs', function () {
    cy.fixture('registration-nlrc').then((registration1) => {
      cy.fixture('registration-nlrc-paper').then((registration2) => {
        registration2.phoneNumber = registration1.phoneNumber;
        cy.importRegistrations(1, [registration1]);
        cy.importRegistrations(2, [registration2]);

        cy.fixture('pa-details-iframe').then((page) => {
          cy.setHoPortal();

          cy.visit(page.url, {
            qs: {
              phonenumber: registration1.phoneNumber,
            },
          });
          cy.url().should('include', 'iframe');
          cy.get('app-recipient-page').should('be.visible');

          cy.get('app-recipient-page ion-label').contains(
            registration1.nameFirst,
          );
          cy.get('app-recipient-page ion-label').contains(
            registration1.nameLast,
          );
          cy.get('app-recipient-page ion-label').contains(
            programLVV.titlePortal.en,
          );
          cy.get('app-recipient-page ion-label').contains(
            registration2.nameFirst,
          );
          cy.get('app-recipient-page ion-label').contains(
            registration2.nameLast,
          );
        });
      });
    });
  });

  it('Visits the PA details iframe page and finds no PAs with provided phonenumber', function () {
    cy.importRegistrations(1);

    cy.fixture('pa-details-iframe').then((page) => {
      cy.setHoPortal();

      cy.visit(page.url, {
        qs: {
          phonenumber: '12313123123',
        },
      });
      cy.url().should('include', 'iframe');
      cy.get('app-recipient-page').should('be.visible');

      const text = portalEn.page.iframe.recipient['no-recipients-found'];
      cy.get('ion-content').contains(text);
    });
  });

  it('Visits the PA details iframe page with no phonenumber provided', function () {
    cy.importRegistrations(1);

    cy.fixture('pa-details-iframe').then((page) => {
      cy.setHoPortal();

      cy.visit(page.url);
      cy.url().should('include', 'iframe');
      cy.get('app-recipient-page').should('be.visible');

      const text = portalEn.page.iframe.recipient['no-phone-number'];
      cy.get('ion-content').contains(text);
    });
  });
});
