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
    moveToSpecifiedPhase(
      programIdundefined: number,
      phaseundefined: string,
    ): Chainable<any>;
    publishProgram(programIdundefined: number): Chainable<any>;
    loginPortal(): Chainable<any>;
    form_request(method: any, url: any, formData: any): Chainable<any>;
    importRegistrationsCsv(programId: any, fileName: any): Chainable<any>;
    importRegistrations(programId: any, body?: any): Chainable<any>;
    includePeopleAffected(
      programIdundefined: number,
      referenceIdsundefined: string[],
    ): Chainable<any>;
    doPayment(
      programIdundefined: number,
      referenceIdsundefined: string[],
      paymentundefined: number,
      amountundefined: number,
    ): Chainable<any>;
    editPaAttribute(
      programIdundefined: number,
      referenceIdundefined: string,
      attributeundefined: string,
      valueundefined: any,
    ): Chainable<any>;
    getAllPeopleAffected(programIdundefined: number): Chainable<any>;
    sendBulkMessage(messageTextundefined: string): Chainable<any>;
    readXlsx(fileNameundefined: string, sheetundefined: string): Chainable<any>;
  }
}
