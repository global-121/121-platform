describe('Personal Page', () => {
  beforeEach(() => {
    cy.setPaApp();
    cy.server();
  });

  // Real API call
  it('shows the default landing page', function () {
    cy.fixture('pa-home').then((pa) => {
      cy.visit(pa.portal);
      cy.url().should('include', '/tabs/personal');
    });
  });
});
