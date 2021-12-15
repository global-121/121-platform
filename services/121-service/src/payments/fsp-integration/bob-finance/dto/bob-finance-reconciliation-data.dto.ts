export class BobFinanceReconciliationData {
  public 'Customer First Name': string;
  public 'Customer Last Name': string;
  public 'Customer Mobile Number': string;
  public 'Transaction Number': string;
  public 'Status': string;
  public 'Status Creation Date': string;
  public 'Status Creation Time': string;
  public 'Amount': string;
  public 'Currency': string;
}

export enum BobFinanceStatus {
  Paid = 'Paid',
  Canceled = 'Canceled',
  Sent = 'Sent',
  Unpaid = 'Unpaid',
}
