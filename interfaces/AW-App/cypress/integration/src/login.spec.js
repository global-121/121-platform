describe('Login Page', () => {
  beforeEach(() => {
    cy.server();
  });

  // Stubbing API calls
  it('default user can log in', function () {
    cy.visit('');
    cy.url().should('include', '/tabs/account');
  });
});
