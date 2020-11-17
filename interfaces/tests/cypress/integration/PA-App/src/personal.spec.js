describe('Personal Page', () => {
  beforeEach(() => {
    cy.setPaApp();
    cy.server();
  });

  // Real API call
  it('default user can observe key elements', function () {
    cy.fixture('pa-home').then((pa) => {
      cy.visit(pa.portal);
      cy.url().should('include', '/home/personal');
    });
  });
});
