// Contains a list of custom Commands

Cypress.Commands.add('setHoPortal', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-HO")) });
Cypress.Commands.add('setAwApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-AW")) });
Cypress.Commands.add('setPaApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-PA")) });
Cypress.Commands.add('setServer', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-server")) });

Cypress.Commands.add('seedDatabase', (seedScript) => {
  cy.fixture('reset-db').then((reset) => {
    cy.setServer();
    cy.request(
      {
        method: "POST",
        url: reset.url,
        qs: {
          "script": seedScript
        },
        body: {
          "secret": Cypress.env('RESET_SECRET')
        }
      }
    )
  });
})
