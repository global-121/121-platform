// Seed scripts should be per FSP
// except for the (NLRC one we left for debugging and because it's used in a lot of tests, and test-multiple which is used to test multiple program attributes and programs).
export enum SeedScript {
  productionInitialState = 'production-initial-state',
  testMultiple = 'test-multiple',
  nlrcMultiple = 'nlrc-multiple',
  nlrcMultipleMock = 'nlrc-multiple-mock-data',
  // we keep one specific program for each FSP at least (Intersolve Visa/Voucher are covered in nlrcMultiple)
  cbeProgram = 'cbe-program',
  safaricomProgram = 'safari-program',
  airtelProgram = 'airtel-program',
  cooperativeBankOfOromiaProgram = 'cooperative-bank-of-oromia-program',
  // excelProgram = 'excel-program',
  nedbankProgram = 'nedbank-program',
  onafriqProgram = 'onafriq-program',
  demoPrograms = 'demo-programs',
}
