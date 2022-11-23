// Contains a list of custom Commands
Cypress.Commands.add('setHoPortal', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-HO" as any)) });
Cypress.Commands.add('setAwApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-AW" as any)) });
Cypress.Commands.add('setPaApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-PA" as any)) });
Cypress.Commands.add('setServer', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-server" as any)) });

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
  cy.setServer();
  cy.fixture('portal-login').then((credentials) => {
    cy.setServer();
    cy.request(
      {
        method: "POST",
        url: 'user/login',
        body: {username: credentials.username, password: credentials.password}
      }
    )
  });
})

Cypress.Commands.add('loginPortal', () => {
  cy.setHoPortal();
  cy.fixture('portal-login').then((login) => {
    cy.setHoPortal();
    cy.visit(login.portal);
    cy.get('input[name="email"]').type(login.username);
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

Cypress.Commands.add('importRegistrationsCsv', (programId, fileName) => {
  const folderPath = '../../../../features/test-registration-data'
  const filePath = `${folderPath}/${fileName}`
  const url = Cypress.config('baseUrl-server' as any) + `/programs/${programId}/registrations/import-registrations`;

  cy.fixture(filePath, 'binary').then((csvBin) => {
    const blob = Cypress.Blob.binaryStringToBlob(csvBin, 'text/csv');
    const formData = new FormData();
    formData.set('file', blob, filePath);
    cy.form_request('POST', url, formData);
  })
})

Cypress.Commands.add('importRegistrations', (programId, body) => {
  cy.setServer();
  cy.fixture('registration-nlrc').then((registration) => {
    if (!body) {
      body = [registration]
    }
    cy.request(
      {
        method: "POST",
        url: `/programs/${programId}/registrations/import-registrations-cypress`,
        body: body
      }
    )
  })
})


declare namespace Cypress {
  interface Chainable<Subject> {
    form_request(method: string, url: string, formData: any): void;
    generateToken({ secret }): void;
    importRegistrations(programId: number, data?: any): void;
    importRegistrationsCsv(programId: number, fileName: string): void;
    loginApi(): void;
    loginPortal(): void;
    seedDatabase(): void;
    setAwApp(): void;
    setHoPortal(): void;
    setPaApp(): void;
    setServer(): void;
  }
}
