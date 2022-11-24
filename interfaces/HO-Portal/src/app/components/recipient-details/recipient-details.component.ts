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
  private formatString = 'yyyy-MM-dd, HH:mm';
  private locale = environment.defaultLocale;
  private keysToExclude = [
    'id',
    'data',
    'name',
    'paTableAttributes',
    'hasPhoneNumber',
    'referenceId',
    'programId',
    'phone-number',
  ];

  public columns = {
    columnPersonalInformation: [],
    columnProgramHistory: [],
    columnPaymentHistory: [],
  };

  public columnOrder = [
    'columnPersonalInformation',
    'columnProgramHistory',
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
  }

  private mapToKeyValue() {
    if (!this.recipient || !this.recipient.paTableAttributes) {
      return;
    }

    for (const key of Object.keys(this.recipient)) {
      if (this.keysToExclude.includes(key)) {
        continue;
      }
      const column = this.getColumn(key);

      // Add ' label !== translationKey && ' to this if when the translations for date columns are fixed
      if (!this.recipient[key]) {
        continue;
      }
      this.columns[column].push(
        this.getRecipientDetail(
          key,
          this.translate.instant(`recipient-details.${key}`),
          this.recipient[key],
        ),
      );
    }

    for (const key of Object.keys(this.recipient.paTableAttributes)) {
      const column = this.getColumn(key);
      const programQuestion = this.program.programQuestions.find(
        (q) => q.name === key,
      );
      if (!programQuestion) {
        continue;
      }
      this.columns[column].push(
        this.getRecipientDetail(
          key,
          this.translatableString.get(programQuestion.shortLabel),
          this.recipient.paTableAttributes[key].value,
          this.recipient.paTableAttributes[key].type,
        ),
      );
    }
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

    return { key, label, value };
  }

  private getColumn(key: string) {
    if (RegistrationStatusTimestampField[key]) {
      return 'columnProgramHistory';
    }

    const keysToCol = {
      status: 'columnProgramHistory',
      fsp: 'columnPaymentHistory',
      paymentAmountMultiplier: 'columnPaymentHistory',
    };

    return keysToCol[key] || 'columnPersonalInformation';
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

  public async buttonClick(
    recipient: Person,
    program: Program,
    transaction: Transaction,
  ) {
    let voucherUrl = null;
    let voucherButtons = null;

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
