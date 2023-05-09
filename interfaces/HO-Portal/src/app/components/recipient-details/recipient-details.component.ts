import { formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { environment } from '../../../environments/environment';
import StatusDate from '../../enums/status-dates.enum';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { StatusEnum } from '../../models/status.enum';
import { IntersolvePayoutStatus } from '../../models/transaction-custom-data';
import { Transaction } from '../../models/transaction.model';
import { PaymentStatusPopupComponent } from '../../program/payment-status-popup/payment-status-popup.component';

class RecipientDetail {
  key: string;
  label: string;
  value: any;
}

@Component({
  selector: 'app-recipient-details',
  templateUrl: './recipient-details.component.html',
  styleUrls: ['./recipient-details.component.scss'],
})
export class RecipientDetailsComponent implements OnInit {
  @Input()
  recipient: Person;

  @Input()
  program: Program;

  public keysAnswersMap = {};
  public transactions: Transaction[] = [];
  public translationPrefix = 'recipient-details.';
  public statusText = '';
  public DateFormat = DateFormat;
  private locale = environment.defaultLocale;

  private readonly timestampKeys = Object.values(StatusDate);

  private attributesToInclude = [
    'registrationProgramId',
    'name',
    'phoneNumber',
    'preferredLanguage',
    'fspDisplayNamePortal',
    'paymentAmountMultiplier',
    ...this.timestampKeys,
  ];

  private questionKeysToInclude = [
    'whatsappPhoneNumber',
    'namePartnerOrganization',
  ];

  private telKeys = ['phoneNumber', 'whatsappPhoneNumber'];

  public columns = {
    columnPersonalInformation: [],
    columnNotes: [],
    columnStatusHistory: [],
    columnPaymentHistory: [],
  };

  public columnOrder = [
    'columnPersonalInformation',
    'columnNotes',
    'columnStatusHistory',
    'columnPaymentHistory',
  ];

  private valueTranslators = {
    preferredLanguage: 'page.program.program-people-affected.language',
    status: 'page.program.program-people-affected.status',
  };

  constructor(
    private programsServiceApiService: ProgramsServiceApiService,
    private modalController: ModalController,
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
  ) {}

  async ngOnInit() {
    this.mapToKeyValue();

    this.transactions = await this.getTransactions();
    this.statusText = this.translate.instant(
      this.translationPrefix + 'statusText',
      {
        status: this.translateValue('status', this.recipient?.status),
      },
    );
  }

  private mapToKeyValue() {
    if (!this.recipient) {
      return;
    }

    for (const key of Object.keys(this.recipient)) {
      if (!this.attributesToInclude.includes(key)) {
        continue;
      }
      if (!this.recipient[key]) {
        continue;
      }
      const column = this.getColumn(key);

      this.columns[column.columnName].splice(
        column.index,
        0,
        this.getRecipientDetail(
          key,
          this.translate.instant(`recipient-details.${key}`),
          this.recipient[key],
        ),
      );
    }

    for (const key of Object.keys(this.recipient)) {
      if (!this.questionKeysToInclude.includes(key)) {
        continue;
      }
      if (!this.recipient[key]) {
        continue;
      }
      const column = this.getColumn(key);
      const fsp = this.program.financialServiceProviders.find(
        (f) => f.fsp === this.recipient.fsp,
      );
      const fspQuestion = fsp.questions.find((q) => q.name === key);
      const customAttribute = this.program.programCustomAttributes.find(
        (ca) => ca.name === key,
      );

      if (!customAttribute && !fspQuestion) {
        continue;
      }

      const shortLabel = customAttribute?.label || fspQuestion?.shortLabel;
      this.columns[column.columnName].splice(
        column.index,
        0,
        this.getRecipientDetail(
          key,
          this.translatableString.get(shortLabel),
          this.recipient[key],
        ),
      );
    }
    this.sortStatusHistory();
  }

  private getRecipientDetail(
    key: string,
    label: string,
    value: any,
  ): RecipientDetail {
    if (this.timestampKeys.includes(key)) {
      value = formatDate(value, DateFormat.dayAndTime, this.locale);
    }
    if (this.valueTranslators[key]) {
      value = this.translateValue(key, value);
    }
    if (this.telKeys.includes(key) && value !== '') {
      value = '+' + value;
    }

    return { key, label, value };
  }

  private getColumn(key: string): { columnName: string; index: number } {
    if (this.timestampKeys.includes(key)) {
      return {
        columnName: 'columnStatusHistory',
        index: this.timestampKeys.indexOf(key),
      };
    }
    const defaultColumnName = 'columnPersonalInformation';
    const keysToCol = {
      registrationProgramId: {
        columnName: 'columnPersonalInformation',
        index: 0,
      },
      name: { columnName: 'columnPersonalInformation', index: 1 },
      phoneNumber: { columnName: 'columnPersonalInformation', index: 2 },
      whatsappPhoneNumber: {
        columnName: 'columnPersonalInformation',
        index: 3,
      },
      preferredLanguage: { columnName: 'columnPersonalInformation', index: 4 },
      namePartnerOrganization: {
        columnName: 'columnPersonalInformation',
        index: 5,
      },
      fspDisplayNamePortal: { columnName: 'columnPaymentHistory', index: 0 },
      paymentAmountMultiplier: { columnName: 'columnPaymentHistory', index: 1 },
    };

    return (
      keysToCol[key] || {
        columnName: defaultColumnName,
        index: this.columns[defaultColumnName].length - 1,
      }
    );
  }

  private async getTransactions(): Promise<Transaction[]> {
    if (!this.program) {
      return [];
    }
    let transactions = await this.programsServiceApiService.getTransactions(
      this.program.id,
      null,
      this.recipient.referenceId,
    );

    transactions = transactions.sort((a: Transaction, b: Transaction) => {
      return (
        (Date.parse(b.paymentDate) || 0) - (Date.parse(a.paymentDate) || 0)
      );
    });
    return transactions;
  }

  private translateValue(key: string, value: string) {
    return this.translate.instant(`${this.valueTranslators[key]}.${value}`);
  }

  private hasWaiting(transaction: Transaction): boolean {
    return transaction.status === StatusEnum.waiting;
  }

  private hasError(transaction: Transaction): boolean {
    return transaction.status === StatusEnum.error;
  }

  public enableMessageSentIcon(transaction: Transaction): boolean {
    return (
      transaction.customData &&
      [
        IntersolvePayoutStatus.initialMessage,
        IntersolvePayoutStatus.voucherSent,
      ].includes(transaction.customData.IntersolvePayoutStatus)
    );
  }

  public enableMoneySentIconTable(transaction: Transaction): boolean {
    return (
      (!transaction.customData.IntersolvePayoutStatus ||
        transaction.customData.IntersolvePayoutStatus ===
          IntersolvePayoutStatus.voucherSent) &&
      transaction.status === StatusEnum.success
    );
  }

  private sortStatusHistory() {
    const columnNameStatusHistory = 'columnStatusHistory';
    this.columns[columnNameStatusHistory] = this.columns[
      columnNameStatusHistory
    ].sort(
      (a, b) =>
        this.timestampKeys.indexOf(a.key) - this.timestampKeys.indexOf(b.key),
    );
  }

  public async buttonClick(
    recipient: Person,
    program: Program,
    transaction: Transaction,
  ) {
    let voucherUrl = null;
    let voucherButtons = null;

    const content = this.hasWaiting
      ? this.translate.instant(
          'page.program.program-people-affected.transaction.waiting-message',
        )
      : this.hasError
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.error-message',
        ) +
        ': <strong>' +
        transaction.errorMessage +
        '</strong><br><br>' +
        this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.fix-error',
        )
      : null;

    await this.programsServiceApiService
      .exportVoucher(recipient.referenceId, transaction.payment, program.id)
      .then(
        async (voucherBlob) => {
          voucherUrl = window.URL.createObjectURL(voucherBlob);
          voucherButtons = true;
        },
        (error) => {
          console.log('error: ', error);
          voucherButtons = false;
        },
      );
    const paymentDetails = {
      programId: this.program.id,
      payment: transaction.payment,
      amount: transaction.amount,
      referenceId: this.recipient.referenceId,
      currency: this.program.currency,
    };

    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentStatusPopupComponent,
      componentProps: {
        titleError:
          this.hasError(transaction) || this.hasWaiting(transaction)
            ? `${transaction.payment}: ${formatDate(
                transaction.paymentDate,
                DateFormat.dayAndTime,
                this.locale,
              )}`
            : null,
        content,
        payoutDetails: paymentDetails,
        voucherButtons,
        imageUrl: voucherUrl,
      },
    });
    modal.onDidDismiss().then(() => {
      // Remove the image from browser memory
      if (voucherUrl) {
        window.URL.revokeObjectURL(voucherUrl);
      }
    });
    await modal.present();
  }
}
