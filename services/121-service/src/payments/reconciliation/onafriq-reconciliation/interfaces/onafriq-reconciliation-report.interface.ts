export interface OnafriqReconciliationReport {
  Datestamp: string | null;
  'Transaction ID': string | null;
  'Onafriq Transaction ID': string | null;
  Third_PartyID: string | null;
  Transaction_Type: string | null;
  Transaction_Status: string | null;
  From_MSISDN: string | null;
  To_MSISDN: string | null;
  Send_Currency: string | null;
  Receive_Currency: string | null;
  Send_amount: number | null;
  Receive_amount: number | null;
  Fee_Amount: number | null;
  Balance_before: number | null;
  Balance_after: number | null;
  Related_Transaction_ID: string | null;
  Wallet_Identifier: string | null;
  Partner_name: string | null;
}
