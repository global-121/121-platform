// Contains a list of custom Commands

Cypress.Commands.add('setHoPortal', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-HO")) });
Cypress.Commands.add('setAwApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-AW")) });
Cypress.Commands.add('setPaApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-PA")) });
Cypress.Commands.add('setServer', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-server")) });

Cypress.Commands.add('seedDatabase', () => {
  cy.fixture('reset-db').then((reset) => {
    cy.setServer();
    cy.request(
      {
        method: "POST",
        url: reset.url,
        qs: {
          "script": reset.script
        },
        body: {
          "secret": Cypress.env('RESET_SECRET')
        }
      }
    )
  });
})

Cypress.Commands.add('loginApi', () => {
  cy.fixture('portal-login').then((credentials) => {
    cy.setServer();
    cy.request(
      {
        method: "POST",
        url: 'user/login',
        body: {username: credentials.email, password: credentials.password}
      }
    )
  });
})

Cypress.Commands.add('loginPortal', () => {
  cy.fixture('portal-login').then((login) => {
    cy.setHoPortal();
    cy.visit(login.portal);
    cy.get('input[name="email"]').type(login.email);
    cy.get('input[name="password"]').type(login.password);
    cy.get('*[type="submit"]').click();
    cy.url().should('contain', '/home')
  });
})

// Performs an XMLHttpRequest instead of a cy.request (able to send data as 
// FormData - multipart/form-data)
Cypress.Commands.add('form_request', (method, url, formData) => {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.withCredentials = true;
  xhr.send(formData);
})

Cypress.Commands.add('importRegistrations', (programId) => {
  const fileName = '121-import-test-registrations-NLRC.csv';
  const url = Cypress.config("baseUrl-server") + `/programs/${programId}/registrations/import-registrations`;

  cy.fixture(fileName, 'binary').then((csvBin) => {
    const blob = Cypress.Blob.binaryStringToBlob(csvBin, 'text/csv');
    const formData = new FormData();
    formData.set('file', blob, fileName);
    cy.form_request('POST', url, formData);
  })
})


