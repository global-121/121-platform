describe('Pa Details Page', () => {
  before(() => {
    cy.seedDatabase();

    cy.loginApi();
    
    cy.importRegistrations(1);
    cy.importRegistrations(2);
  });

  beforeEach(() => {
    cy.loginPortal();
  });

  // The below is a copy of login.cy.js, should be replaced by actual test here
  it('visits the PA details iframe page', function () {
    cy.fixture('pa-details-iframe').then((page) => {
      cy.visit(page.url);
      cy.get('h1').contains('Nadira Jacob');
    });
  });

});
