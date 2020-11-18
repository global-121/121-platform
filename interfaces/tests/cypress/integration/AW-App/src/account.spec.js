describe('AW Account Page', () => {
  beforeEach(() => {
    cy.setAwApp();
    cy.server();
  });

  // Real API call
  it('shows the default landing page', function () {
    cy.fixture('aw-app').then((aw) => {
      cy.visit(aw.portal);
      cy.url().should('include', '/tabs/account');
    });
  });
});
