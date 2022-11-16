describe('Pa Details Page', () => {
  before(() => {
    cy.seedDatabase();

    cy.login();
    
    cy.importRegistrations(1);
    cy.importRegistrations(2);
  });

  beforeEach(() => {
    cy.setHoPortal();
  });

  // The below is a copy of login.cy.js, should be replaced by actual test here
  it('lets the user log in', function () {
    cy.fixture('portal-login').then((login) => {
      cy.visit(login.portal);
      cy.get('input[name="email"]').type(login.email);
      cy.get('input[name="password"]').type(login.password);

      cy.get('*[type="submit"]').click();

      cy.url().should('include', '/home');
      cy.get('span').contains('Logged in as');
      cy.get('ion-note').contains(login.email);
    });
  });

});
