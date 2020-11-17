describe('Referral Page', () => {
  beforeEach(() => {
    cy.setReferralApp();
    cy.server();
  });

  // Real API call
  it('default user can observe key elements', function () {
    cy.fixture('referral').then((ref) => {
      cy.visit(ref.portal);
      cy.url().should('include', '/home/referral');
    });
  });
});
