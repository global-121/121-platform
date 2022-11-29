import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AnswerType } from 'src/app/models/fsp.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { RegistrationStatusTimestampField } from '../../../../../../services/121-service/src/registration/enum/registration-status.enum';
import { environment } from '../../../environments/environment';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { StatusEnum } from '../../models/status.enum';
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
  public bannerText = '';
  private formatString = 'yyyy-MM-dd, HH:mm';
  private locale = environment.defaultLocale;
  private keysToExclude = [
    'id',
    'data',
    'paTableAttributes',
    'hasPhoneNumber',
    'hasNote',
    'note',
    'referenceId',
    'programId',
    'phone-number',
    'status',
  ];

  private questionKeysToInclude = [
    'whatsappPhoneNumber',
    'namePartnerOrganization',
  ];

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
    private datePipe: DatePipe,
    private modalController: ModalController,
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
  ) {}

  async ngOnInit() {
    this.mapToKeyValue();

    this.transactions = await this.getTransactions();
    this.bannerText = this.translate.instant(
      this.translationPrefix + 'statusBannerText',
      { status: this.translateValue('status', this.recipient?.status) },
    );
  }

  private mapToKeyValue() {
    if (!this.recipient || !this.recipient.paTableAttributes) {
      return;
    }

    for (const key of Object.keys(this.recipient)) {
      if (this.keysToExclude.includes(key)) {
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

    for (const key of Object.keys(this.recipient.paTableAttributes)) {
      if (!this.questionKeysToInclude.includes(key)) {
        continue;
      }
      if (!this.recipient.paTableAttributes[key].value) {
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
          this.recipient.paTableAttributes[key].value,
          this.recipient.paTableAttributes[key].type,
        ),
      );
    }
    this.sortStatusHistory();
  }

  private getRecipientDetail(
    key: string,
    label: string,
    value: any,
    type?: AnswerType,
  ): RecipientDetail {
    if (RegistrationStatusTimestampField[key] || type === AnswerType.Date) {
      value = this.convertDate(value);
    }
    if (this.valueTranslators[key]) {
      value = this.translateValue(key, value);
    }
    if (key === 'phoneNumber' || type === AnswerType.PhoneNumber) {
      value = '+' + value;
    }

    return { key, label, value };
  }

  private getColumn(key: string): { columnName: string; index: number } {
    if (RegistrationStatusTimestampField[key]) {
      return {
        columnName: 'columnStatusHistory',
        index: Object.keys(RegistrationStatusTimestampField).indexOf(key),
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
      fsp: { columnName: 'columnPaymentHistory', index: 0 },
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
    const transactionsResult =
      await this.programsServiceApiService.getTransactions(
        this.program.id,
        null,
        this.recipient.referenceId,
      );
    return transactionsResult.reverse();
  }

  private convertDate(value) {
    return this.datePipe.transform(value, this.formatString);
  }

  private translateValue(key, value) {
    return this.translate.instant(`${this.valueTranslators[key]}.${value}`);
  }

  private hasWaiting(transaction: Transaction): boolean {
    return transaction.status === StatusEnum.waiting;
  }

  private hasError(transaction: Transaction): boolean {
    return transaction.status === StatusEnum.error;
  }

  private sortStatusHistory() {
    const columnNameStatusHistory = 'columnStatusHistory';
    const statusOrder = Object.values(RegistrationStatusTimestampField);
    const toBeSorted = [...this.columns[columnNameStatusHistory]];
    this.columns[columnNameStatusHistory] = toBeSorted.sort(
      (a, b) => statusOrder.indexOf(a.key) - statusOrder.indexOf(b.key),
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
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentStatusPopupComponent,
      componentProps: {
        titleError: `${transaction.payment}: ${this.datePipe.transform(
          transaction.paymentDate,
          this.formatString,
          this.locale,
        )}`,
        content,
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
