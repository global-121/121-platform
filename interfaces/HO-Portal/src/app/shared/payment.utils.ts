import { PaymentRowDetail } from '../models/payment.model';
import { Person } from '../models/person.model';
import { Program } from '../models/program.model';
import { StatusEnum } from '../models/status.enum';
import { IntersolvePayoutStatus } from '../models/transaction-custom-data';
import { Transaction } from '../models/transaction.model';

export class PaymentUtils {
  static enableMessageSentIcon(transaction: Transaction): boolean {
    return (
      transaction.customData &&
      [
        IntersolvePayoutStatus.initialMessage,
        IntersolvePayoutStatus.voucherSent,
      ].includes(transaction.customData.IntersolvePayoutStatus)
    );
  }

  static enableMoneySentIconTable(transaction: Transaction): boolean {
    return (
      (!transaction.customData.IntersolvePayoutStatus ||
        transaction.customData.IntersolvePayoutStatus ===
          IntersolvePayoutStatus.voucherSent) &&
      transaction.status === StatusEnum.success
    );
  }

  static getPaymentRowInfo(
    transaction: Transaction,
    program: Program,
    person: Person,
    index: number,
  ): PaymentRowDetail {
    return {
      paymentIndex: index,
      text: transaction.paymentDate,
      transaction,
      hasMessageIcon: this.enableMessageSentIcon(transaction),
      hasMoneyIconTable: this.enableMoneySentIconTable(transaction),
      amount: `${transaction.amount} ${program?.currency}`,
      fsp: person.fsp,
      sentDate: transaction.paymentDate,
    };
  }
}
