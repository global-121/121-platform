import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { AnswerType } from '../../models/fsp.model';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { Transaction } from '../../models/transaction.model';
import { PaymentStatusPopupComponent } from '../../program/payment-status-popup/payment-status-popup.component';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';

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

  public labelAnswerMap = {};
  public transactions: Transaction[] = [];
  public translationPrefix = 'recipient-details.';
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
  private dateKeys = [
    'registeredDate',
    'inclusionDate',
    'startedRegistrationDate',
    'importedDate',
    'invitedDate',
    'noLongerEligibleDate',
    'registeredWhileNoLongerEligibleDate',
    'selectedForValidationDate',
    'validationDate',
    'inclusionEndDate',
    'rejectionDate',
  ];

  public columns = {
    columnPersonalInformation: [
      'registrationProgramId',
      'phoneNumber',
      'whatsappPhoneNumber',
      'preferredLanguage',
      'vnumber',
      'dob',
      'inclusionScore',
    ],
    columnProgramHistory: [
      'startedRegistrationDate',
      'invitedDate',
      'registeredDate',
      'importedDate',
      'inclusionDate',
      'noLongerEligibleDate',
      'registeredWhileNoLongerEligibleDate',
      'selectedForValidationDate',
      'validationDate',
      'inclusionEndDate',
      'rejectionDate',
      'status',
    ],
    columnPaymentHistory: ['fsp', 'paymentAmountMultiplier'],
  };

  public orderedColumns = [
    'columnPersonalInformation',
    'columnProgramHistory',
    'columnPaymentHistory',
  ];

  constructor(
    private translatableString: TranslatableStringService,
    private translate: TranslateService,
    private programsServiceApiService: ProgramsServiceApiService,
    private datePipe: DatePipe,
    private modalController: ModalController,
  ) {}

  async ngOnInit() {
    this.mapToKeyValue();
    await this.getTransactions();
    console.log('=== this.labelAnswerMap: ', this.labelAnswerMap);
    console.log('=== this.labelAnswerMap[fsp]: ');
    console.log('=== this.recipient: ', this.recipient);
  }

  private mapToKeyValue() {
    if (!this.recipient || !this.recipient.paTableAttributes) {
      return;
    }

    for (const key of Object.keys(this.recipient)) {
      if (this.keysToExclude.includes(key)) {
        continue;
      }
      let translationKey = this.translationPrefix + key;
      let label = this.translate.instant(translationKey);
      // Add ' label !== translationKey && ' to this if when the translations for date columns are fixed
      if (this.recipient[key]) {
        this.setAndFormatLabelAndValue(label, this.recipient[key], key);
      }
    }
    for (const key of Object.keys(this.recipient.paTableAttributes)) {
      let label = '';
      const question = this.program.programQuestions.find(
        (question) => question.name === key,
      );
      if (question && this.recipient.paTableAttributes[key]) {
        label = this.translatableString.get(question.shortLabel);
        if (label) {
          this.setAndFormatLabelAndValue(
            label,
            this.recipient.paTableAttributes[key].value,
            key,
          );
        }
      }
    }
  }

  private async getTransactions() {
    if (!this.program) {
      return;
    }
    const transactionsResult =
      await this.programsServiceApiService.getTransactions(
        this.program.id,
        null,
        this.recipient.referenceId,
      );
    this.transactions = transactionsResult.reverse();
  }

  private setAndFormatLabelAndValue(
    label: string,
    value: string,
    key?: string,
    type?: AnswerType,
  ) {
    if (type === AnswerType.Date || this.dateKeys.includes(key)) {
      value = this.datePipe.transform(value, 'medium');
    }
    console.log('label: ', label);
    this.labelAnswerMap[key] = value;
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
          'yyyy-MM-dd, HH:mm',
          environment.defaultLocale,
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

    this.transactions = await this.programsServiceApiService.getTransactions(
      this.program.id,
      null,
      this.recipient.referenceId,
    );
  }
}
