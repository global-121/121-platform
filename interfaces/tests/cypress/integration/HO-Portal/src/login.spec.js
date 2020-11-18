describe('Login Page', () => {
  beforeEach(() => {
    cy.setHoPortal();
    cy.server();
  });

  // Real API call
  it('lets the user log in', function () {
    cy.fixture('ho-login').then((login) => {
      cy.visit(login.portal);
      cy.get('input[name="email"]').type(login.email);
      cy.get('input[name="password"]').type(login.password);

      cy.get('*[type="submit"]').click();
      cy.url().should('include', '/home');
      cy.get('ion-buttons').contains('Logged in as');
      cy.get('ion-buttons').contains(login.email);
    });
  });

  // Stubbing API calls
  it('lets the user log in with fake API call', function () {
    cy.fixture('ho-user').then((user) => {
      cy.route({
        method: 'POST',
        url: '*/user/login*',
        response: user,
      }).as('post');

      cy.route({
        method: 'GET',
        url: '*/programs*',
        response: {},
      }).as('programs');

      cy.visit('/login');
      cy.get('input[name="email"]').type('xyz');
      cy.get('input[name="password"]').type('xyz');
      cy.get('*[type="submit"]').click();
      cy.wait(['@post']);
      cy.wait(['@programs']);

      cy.get('h2').should('contain', 'All Programs');
      cy.url().should('include', '/home');
      cy.get('ion-buttons').contains('Logged in as');
      cy.get('ion-buttons').contains(user.user.role);
    });
  });
});
