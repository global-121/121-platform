describe('AW Account Page', () => {
  beforeEach(() => {
    cy.setAwApp();
    cy.server();
  });

  // Real API call
  it('default user can observe key elements', function () {
    cy.fixture('aw-app').then((aw) => {
      cy.visit(aw.portal);
      cy.url().should('include', '/home/account');
    });
  });
});
