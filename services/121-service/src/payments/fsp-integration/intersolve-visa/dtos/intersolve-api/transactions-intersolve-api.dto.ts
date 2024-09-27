export interface TransactionsIntersolveApiDto {
  id: number;
  quantity: { assetCode: string; value: number };
  createdAt: string;
  creditor: { tokenCode: string };
  debtor: { tokenCode: string | null };
  reference: string;
  type: string;
  description: string;
  location: { merchantCode: string; merchantLocationCode: string };
  originalTransactionId: number;
  paymentId: number;
}
