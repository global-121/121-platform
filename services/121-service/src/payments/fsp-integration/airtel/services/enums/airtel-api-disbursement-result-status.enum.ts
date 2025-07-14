export enum AirtelApiDisbursementStatusResponseCodeEnum {
  // Airtel API has a lot more codes but the only ones we use in our (non-test)
  // code are these.
  DP00900001000 = 'DP00900001000', // ambiguous
  DP00900001001 = 'DP00900001001', // success
  DP00900001011 = 'DP00900001011', // duplicate
}
