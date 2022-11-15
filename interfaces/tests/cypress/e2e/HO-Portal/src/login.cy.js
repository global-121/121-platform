describe('Login Page', () => {
  beforeEach(() => {
    cy.setHoPortal();
    // cy.server();
  });

  // Real log-in API-call
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

  // Example of stubbing API calls: fill in wrong credentials but intercept the API-call with a predefined (real) response
  // This means you can skip certain steps in a flow without having to make all API-calls 
  it('lets the user log in with fake API call', function () {
    cy.fixture('portal-user').then((user) => {
      user.expires = new Date(2020,1,1);
      console.log('user: ', user);
      cy.intercept('POST', '*/user/login*', {
        statusCode: 201,
        body: user
      }).as('login');
      cy.intercept('GET', '*/programs/assigned/all*', {
        statusCode: 201,
        body: {}
      }).as('programs');

      cy.visit('/login');
      cy.get('input[name="email"]').type('wrongemail@test.nl');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('*[type="submit"]').click();
      cy.wait(['@login']);
      cy.wait(['@programs']);

      cy.url().should('include', '/home');
      cy.get('h2').should('contain', 'Programs');
      cy.get('span').contains('Logged in as');
      cy.get('ion-note').contains(user.username);
    });
  });
});
