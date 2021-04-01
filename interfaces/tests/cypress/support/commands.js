// Contains a list of custom Commands

Cypress.Commands.add('setHoPortal', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-HO")) });
Cypress.Commands.add('setAwApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-AW")) });
Cypress.Commands.add('setPaApp', () => { Cypress.config("baseUrl", Cypress.config("baseUrl-PA")) });
