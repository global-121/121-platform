export interface OnafriqReconciliationReport {
  Datestamp: string;
  'Transaction ID': string;
  'Onafriq Transaction ID': string | null;
  Third_PartyID: string;
  Transaction_Type: string;
  Transaction_Status: string;
  From_MSISDN: string | undefined;
  To_MSISDN: string;
  Send_Currency: string | null;
  Receive_Currency: string | undefined;
  Send_amount: number | null;
  Receive_amount: number | null;
  Fee_Amount: number | null;
  Balance_before: number | null;
  Balance_after: number | null;
  Related_Transaction_ID: string | null;
  Wallet_Identifier: string | undefined;
  Partner_name: string | undefined;
}
