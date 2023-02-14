const portalEn = require('../../../HO-Portal/src/assets/i18n/en.json');
import XLSX from 'xlsx';

// Contains a list of custom Commands
Cypress.Commands.add('setHoPortal', () => {
  Cypress.config('baseUrl', Cypress.env('baseUrl-HO'));
});
Cypress.Commands.add('setAwApp', () => {
  Cypress.config('baseUrl', Cypress.env('baseUrl-AW'));
});
Cypress.Commands.add('setPaApp', () => {
  Cypress.config('baseUrl', Cypress.env('baseUrl-PA'));
});
Cypress.Commands.add('setServer', () => {
  Cypress.config('baseUrl', Cypress.env('baseUrl-server'));
});

Cypress.Commands.add('seedDatabase', () => {
  cy.fixture('reset-db').then((reset) => {
    cy.setServer();
    cy.request({
      method: 'POST',
      url: reset.url,
      qs: {
        script: reset.script,
      },
      body: {
        secret: Cypress.env('RESET_SECRET'),
      },
    });
  });
});

Cypress.Commands.add('loginApi', (admin?: boolean) => {
  const fixture = admin ? 'admin' : 'portal-login';
  cy.setServer();
  cy.fixture(fixture).then((credentials) => {
    console.log('credentials: ', credentials);
    cy.setServer();
    cy.request({
      method: 'POST',
      url: 'user/login',
      body: { username: credentials.username, password: credentials.password },
    });
  });
});

Cypress.Commands.add(
  'moveToSpecifiedPhase',
  (programId: number, phase: string) => {
    cy.setServer();
    cy.loginApi();
    cy.request({
      method: 'POST',
      url: `programs/${programId}/change-phase`,
      body: {
        newPhase: phase,
      },
    });
  },
);

Cypress.Commands.add('publishProgram', (programId: number) => {
  cy.setServer();
  cy.loginApi();
  cy.request({
    method: 'POST',
    url: `programs/${programId}/change-phase`,
    body: {
      newPhase: 'registrationValidation',
    },
  });
});

Cypress.Commands.add('loginPortal', () => {
  cy.setHoPortal();
  cy.fixture('portal-login').then((fixture) => {
    cy.setHoPortal();
    cy.visit(fixture.loginPath);
    cy.get('input[name="email"]').type(fixture.username);
    cy.get('input[name="password"]').type(fixture.password);
    cy.get('*[type="submit"]').click();
  });
});

// Performs an XMLHttpRequest instead of a cy.request (able to send data as
// FormData - multipart/form-data)
Cypress.Commands.add('form_request', (method, url, formData) => {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.withCredentials = true;
  xhr.send(formData);
});

Cypress.Commands.add('importRegistrationsCsv', (programId, fileName) => {
  const folderPath = '../../../../features/test-registration-data';
  const filePath = `${folderPath}/${fileName}`;
  const url =
    Cypress.env('baseUrl-server') +
    `/programs/${programId}/registrations/import-registrations`;

  cy.fixture(filePath, 'binary').then((csvBin) => {
    const blob = Cypress.Blob.binaryStringToBlob(csvBin, 'text/csv');
    const formData = new FormData();
    formData.set('file', blob, filePath);
    cy.form_request('POST', url, formData);
  });
});

Cypress.Commands.add('importRegistrations', (programId: number, body?: any) => {
  cy.setServer();
  cy.fixture('registration-nlrc').then((registration) => {
    if (!body) {
      body = [registration];
    }
    return cy.request({
      method: 'POST',
      url: `/programs/${programId}/registrations/import-registrations-cypress`,
      body: body,
    });
  });
});

Cypress.Commands.add(
  'includePeopleAffected',
  (programId: number, referenceIds: string[]) => {
    cy.setServer();
    cy.loginApi();
    return cy.request({
      method: 'POST',
      url: `programs/${programId}/registrations/include`,
      body: { referenceIds },
    });
  },
);

Cypress.Commands.add(
  'doPayment',
  (
    programId: number,
    referenceIds: string[],
    payment: number,
    amount: number,
  ) => {
    cy.setServer();
    cy.loginApi();
    return cy.request({
      method: 'POST',
      url: `programs/${programId}/payments`,
      body: { referenceIds: { referenceIds }, payment, amount },
    });
  },
);

Cypress.Commands.add(
  'editPaAttribute',
  (
    programId: number,
    referenceId: string,
    attribute: string,
    value: string | number,
  ) => {
    cy.setServer();
    cy.loginApi();
    return cy.request({
      method: 'POST',
      url: `programs/${programId}/registrations/attribute`,
      body: { referenceId, attribute, value },
    });
  },
);

Cypress.Commands.add('getAllPeopleAffected', (programId: number) => {
  cy.setServer();
  cy.loginApi();
  return cy.request({
    method: 'GET',
    url: `programs/${programId}/registrations`,
  });
});

Cypress.Commands.add('sendBulkMessage', (messageText: string) => {
  const dropdownText =
    portalEn.page.program['program-people-affected'].actions['send-message'];
  cy.get(
    '.ion-justify-content-between > :nth-child(1) > ion-row.md > .styled-select',
  ).select(dropdownText);
  cy.get('label > input').click();
  cy.get('[data-cy="apply-action"]').click();
  cy.get('[data-cy="input-props-textarea"]').type(messageText, { delay: 1 });
  cy.get('[data-cy="input-prompt-confirm"]').click();
});

Cypress.Commands.add('readXlsx', (fileName: string, sheet: string) => {
  const filePath = `cypress/downloads/${fileName}`;
  cy.readFile(filePath, null).then((text) => {
    const workbook = XLSX.read(text, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
    return rows;
  });
});
