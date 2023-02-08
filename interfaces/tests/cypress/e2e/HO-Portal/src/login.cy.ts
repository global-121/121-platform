import portalText from '../../../../../HO-Portal/src/assets/i18n/en.json';

describe('Login Page', () => {
  before(() => {
    cy.seedDatabase();
  });

  beforeEach(() => {
    cy.setHoPortal();
  });

  it('lets the user log in', function () {
    cy.fixture('portal-login').then((fixture) => {
      cy.intercept('GET', '*/programs/assigned/all*', {
        statusCode: 201,
        body: {},
      }).as('programs');

      cy.loginPortal();

      cy.wait(['@programs']);

      cy.url().should('include', '/home');
      cy.get('h2').should('contain', 'Programs');

      cy.get('app-user-state').contains(
        portalText['user-state']['logged-in-as'],
      );
      cy.get('app-user-state').contains(fixture.username);
    });
  });

  it('shows an error when using incorrect credentials', function () {
    cy.fixture('portal-login').then((fixture) => {
      cy.visit(fixture.loginPath);

      cy.get('[data-cy="login-form"]')
        .get('input[name="email"]')
        .type('wrongemail@test.nl');
      cy.get('[data-cy="login-form"]')
        .get('input[name="password"]')
        .type('wrongpassword');
      cy.get('[data-cy="login-form"]').get('button[type="submit"]').click();

      cy.get('.login-notification').contains(
        portalText.common['unknown-error'],
      );
    });
  });
});
