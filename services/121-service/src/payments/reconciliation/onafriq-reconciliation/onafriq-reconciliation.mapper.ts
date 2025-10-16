import { env } from '@121-service/src/env';
import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqReconciliationReport } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/interfaces/onafriq-reconciliation-report.interface';

export class OnafriqReconciliationMapper {
  public static mapTransactionToReportItem(
    onafriqTransaction: OnafriqTransactionEntity,
    corporateCode: string,
  ): OnafriqReconciliationReport {
    return {
      Datestamp: onafriqTransaction.transaction.created.toISOString(),
      'Transaction ID': onafriqTransaction.thirdPartyTransId, // same as 'Third_PartyID'
      'Onafriq Transaction ID': onafriqTransaction.mfsTransId,
      Third_PartyID: onafriqTransaction.thirdPartyTransId,
      Transaction_Type: 'Transfer', // 'Transfer' or 'Reversal'. We use only 'Transfer'.
      Transaction_Status: onafriqTransaction.transaction.status, // NOTE: map to 'Success', 'Fail', 'Pending'?
      From_MSISDN: env.ONAFRIQ_SENDER_MSISDN,
      To_MSISDN: onafriqTransaction.recipientMsisdn,
      Send_Currency: null, // We use 'Receive' type, so this is  N.A.
      Receive_Currency: env.ONAFRIQ_CURRENCY_CODE,
      Send_amount: null, // We use 'Receive' type, so this is  N.A.
      Receive_amount: onafriqTransaction.transaction.amount,
      Fee_Amount: null, // We use 'Receive' type, so this is  N.A.
      Balance_before: null, // leave empty for now, take up again if requested
      Balance_after: null, // leave empty for now, take up again if requested
      Related_Transaction_ID: null, // N.A. for Transaction_Type = 'Transfer'
      Wallet_Identifier: corporateCode,
      Partner_name: corporateCode,
    };
  }
}
