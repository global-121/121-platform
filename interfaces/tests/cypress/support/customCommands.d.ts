/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace Cypress {
  interface Chainable<Subject> {
    setHoPortal(): Chainable<any>;
    setAwApp(): Chainable<any>;
    setPaApp(): Chainable<any>;
    setServer(): Chainable<any>;
    seedDatabase(): Chainable<any>;
    loginApi(admin?: boolean): Chainable<any>;
    moveToSpecifiedPhase(programId: number, phase: string): Chainable<any>;
    publishProgram(programId: number): Chainable<any>;
    loginPortal(): Chainable<any>;
    form_request(
      method: string,
      url: string,
      formData: FormData,
    ): Chainable<any>;
    importRegistrationsCsv(programId: number, fileName: string): Chainable<any>;
    importRegistrations(programId: number, body?: any): Chainable<any>;
    includePeopleAffected(
      programId: number,
      referenceIds: string[],
    ): Chainable<any>;
    doPayment(
      programId: number,
      referenceIds: string[],
      payment: number,
      amount: number,
    ): Chainable<any>;
    editPaAttribute(
      programId: number,
      referenceId: string,
      attribute: string,
      value: any,
    ): Chainable<any>;
    getAllPeopleAffected(programId: number): Chainable<any>;
    sendBulkMessage(messageText: string): Chainable<any>;
    readXlsx(fileName: string, sheet: string): Chainable<any>;
  }
}
