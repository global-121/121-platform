import { RegistrationStatusEnum } from '../../../../../services/121-service/src/registration/enum/registration-status.enum';
import FspName from '../enums/fsp-name.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import {
  PaymentRowDetail,
  TransactionCustomDataAttributes,
} from '../models/payment.model';
import { Program } from '../models/program.model';
import { StatusEnum } from '../models/status.enum';
import { Transaction } from '../models/transaction.model';
import {
  FilterOperatorEnum,
  PaginationFilter,
} from '../services/filter.service';

export class PaymentUtils {
  static getPaymentRowInfo(
    transaction: Transaction,
    program: Program,
    index: number,
  ): PaymentRowDetail {
    return {
      paymentIndex: index,
      text: transaction.paymentDate,
      transaction,
      amount: transaction.amount,
      currency: program?.currency,
      fsp: transaction.fsp as FspName,
      sentDate: transaction.paymentDate,
      paymentDate: transaction.paymentDate,
    };
  }

  static getTransactionOfPaymentForRegistration(
    paymentIndex: number,
    referenceId: string,
    pastTransactions: Transaction[],
  ): Transaction {
    return pastTransactions.find(
      (transaction) =>
        transaction.payment === paymentIndex &&
        transaction.referenceId === referenceId,
    );
  }

  static hasVoucherSupport(fsp: FspName | string): boolean {
    const supportedFsps = [
      FspName.intersolveVoucherPaper,
      FspName.intersolveVoucherWhatsapp,
    ];
    return supportedFsps.includes(fsp as FspName);
  }

  static hasPhysicalCardSupport(fsp: FspName | string): boolean {
    const supportedFsps = [FspName.intersolveVisa];
    return supportedFsps.includes(fsp as FspName);
  }

  static enableSinglePayment(
    paymentRow: PaymentRowDetail,
    canDoSinglePayment: boolean,
    registrationStatus: RegistrationStatusEnum,
    lastPaymentId: number,
    paymentInProgress: boolean,
  ): boolean {
    if (!paymentRow) {
      return false;
    }
    const permission = canDoSinglePayment;
    const included = registrationStatus === RegistrationStatus.included;
    const noPaymentDone = !paymentRow.transaction;
    const noFuturePayment = paymentRow.paymentIndex <= lastPaymentId;
    // Note, the number 5 is the same as allowed for the bulk payment as set in program-people-affected.component
    const onlyLast5Payments = paymentRow.paymentIndex > lastPaymentId - 5;
    const noPaymentInProgress = !paymentInProgress;

    return (
      permission &&
      included &&
      noPaymentDone &&
      noFuturePayment &&
      onlyLast5Payments &&
      noPaymentInProgress
    );
  }

  static hasWaiting(paymentRow: PaymentRowDetail): boolean {
    return !!paymentRow.waiting;
  }

  static hasError(paymentRow: PaymentRowDetail): boolean {
    if (paymentRow.errorMessage) {
      return true;
    }

    if (paymentRow.status === StatusEnum.error) {
      return true;
    }

    return false;
  }

  static getCustomDataAttributesToShow(paymentRow: PaymentRowDetail) {
    if (paymentRow.transaction?.fsp === FspName.intersolveVisa) {
      return [TransactionCustomDataAttributes.intersolveVisaWalletTokenCode];
    } else {
      return [];
    }
  }

  static refernceIdsToFilter(referenceIds: string[]): PaginationFilter[] {
    return [
      {
        value: referenceIds.join(','),
        name: 'referenceId',
        label: 'referenceId',
        operator: FilterOperatorEnum.in,
      },
    ];
  }
}
