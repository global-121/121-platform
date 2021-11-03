export class BobFinanceFspInstructions {
  public 'Receiver First name': string;
  public 'Receiver last name': string;
  public 'Mobile Number': string;
  public 'Email': string;
  public 'Amount': number;
  public 'Expiry Date': string;
}

export enum BobFinanceFspInstructionsEnum {
  receiverFirstName = 'Receiver First name',
  receiverLastName = 'Receiver last name',
  mobileNumber = 'Mobile Number',
  email = 'Email',
  amount = 'Amount',
  currency = 'Currency',
  expiryDate = 'Expiry Date',
}
