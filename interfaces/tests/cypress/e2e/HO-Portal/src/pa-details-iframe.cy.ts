import programLVV from '../../../../../../services/121-service/seed-data/program/program-pilot-nl.json';
import portalEn from '../../../../../../interfaces/HO-Portal/src/assets/i18n/en.json'

describe('Pa Details Page', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.setServer();
    cy.loginApi();
    cy.setHoPortal();
    cy.loginPortal();
  });

  it('visits the accordion iframe page and finds one PA and checks details', function () {
    cy.importRegistrations(1);
    cy.fixture('pa-details-iframe').then((page) => {
      cy.fixture('registration-nlrc').then((registration) => {
        cy.setHoPortal()
        cy.visit(page.url, {
          qs: {
            phonenumber: registration.phoneNumber
          }
        })
        cy.url().should('include', 'iframe');
        cy.get('ion-label').contains(registration.nameFirst);
        cy.get('ion-label').contains(registration.nameLast);
        cy.get('ion-label').contains(programLVV.titlePortal.en);
        cy.get('ion-label').contains(registration.nameFirst);
        cy.get('ion-label').contains(registration.nameLast);
        cy.get('ion-label').contains(programLVV.titlePortal.en);
        cy.get('app-recipient-details').contains(registration.phoneNumber);
        cy.get('app-recipient-details').contains(registration.whatsappPhoneNumber);
        cy.get('app-recipient-details').contains(registration.vnumber);
        cy.get('app-recipient-details').contains(registration.fspName);
        cy.get('app-recipient-details').contains(registration.preferredLanguage);
        for (const [_key, value] of Object.entries(portalEn['recipient-details'])) {
          cy.get('app-recipient-details').contains(value);
        }
      })
    });
  });

  it('visits the accordion iframe page and find one PA on whatsapp number', function () {
    cy.fixture('registration-nlrc').then((registration) => {
      const whatsappPhone = 14155238887
      registration.whatsappPhoneNumber = whatsappPhone;
      cy.importRegistrations(1, [registration]);
      cy.fixture('pa-details-iframe').then((page) => {
        cy.setHoPortal()
        cy.visit(page.url, {
          qs: {
            phonenumber: whatsappPhone
          }
        })
        cy.url().should('include', 'iframe');
        cy.get('ion-label').contains(registration.nameFirst);
        cy.get('ion-label').contains(registration.nameLast);
        cy.get('ion-label').contains(programLVV.titlePortal.en);
      })
    });
  });

  it('visits the accordion iframe page and finds 2 PA', function () {
    cy.fixture('registration-nlrc').then((registration1) => {
      cy.fixture('registration-nlrc-no-whatsapp').then((registration2) => {
        registration2.phoneNumber = registration1.phoneNumber
        cy.importRegistrations(1, [registration1, registration2]);
        cy.fixture('pa-details-iframe').then((page) => {
          cy.setHoPortal()
          cy.visit(page.url, {
            qs: {
              phonenumber: registration1.phoneNumber
            }
          })
          cy.url().should('include', 'iframe');
          cy.get('ion-label').contains(registration1.nameFirst);
          cy.get('ion-label').contains(registration1.nameLast);
          cy.get('ion-label').contains(programLVV.titlePortal.en);
          cy.get('ion-label').contains(registration2.nameFirst);
          cy.get('ion-label').contains(registration2.nameLast);
        })
      })
    });
  });

  it('visits the accordion iframe page and finds no PA', function () {
    cy.importRegistrations(1);
    cy.fixture('pa-details-iframe').then((page) => {
      cy.setHoPortal()
      cy.visit(page.url, {
        qs: {
          phonenumber: '12313123123'
        }
      })
      cy.url().should('include', 'iframe');
      const text = portalEn.page.iframe.recipient['no-recipients-found']
      cy.get('ion-content').contains(text);
    });
  });

  it('visits the accordion iframe page with no phonenumber', function () {
    cy.importRegistrations(1);
    cy.fixture('pa-details-iframe').then((page) => {
      cy.setHoPortal()
      cy.visit(page.url)
      cy.url().should('include', 'iframe');
      const text = portalEn.page.iframe.recipient['no-phone-number']
      cy.get('ion-content').contains(text);
    });
  });
})
