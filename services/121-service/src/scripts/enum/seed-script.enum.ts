// Seed scripts should be per FSP
// except for the (NLRC one we left for debugging and because it's used in a lot of tests, and test-multiple which is used to test multiple project attributes and projects).
export enum SeedScript {
  productionInitialState = 'production-initial-state',
  testMultiple = 'test-multiple',
  nlrcMultiple = 'nlrc-multiple',
  nlrcMultipleMock = 'nlrc-multiple-mock-data',
  // we keep one specific project for each FSP at least (Intersolve Visa/Voucher are covered in nlrcMultiple)
  cbeProject = 'cbe-project',
  safaricomProject = 'safari-project',
  airtelProject = 'airtel-project',
  // excelProject = 'excel-project',
  nedbankProject = 'nedbank-project',
  onafriqProject = 'onafriq-project',
  demoProjects = 'demo-projects',
}
