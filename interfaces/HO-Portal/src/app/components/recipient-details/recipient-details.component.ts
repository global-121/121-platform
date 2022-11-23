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

  private valueTranslators = {
    preferredLanguage: 'page.program.program-people-affected.language',
    status: 'page.program.program-people-affected.status',
  };

  constructor(
    private programsServiceApiService: ProgramsServiceApiService,
    private datePipe: DatePipe,
    private modalController: ModalController,
    private translate: TranslateService,
  ) {}

  async ngOnInit() {
    this.mapToKeyValue();
    await this.getTransactions();
  }

  private mapToKeyValue() {
    if (!this.recipient || !this.recipient.paTableAttributes) {
      return;
    }

    for (const key of Object.keys(this.recipient)) {
      if (this.keysToExclude.includes(key)) {
        continue;
      }
      // Add ' label !== translationKey && ' to this if when the translations for date columns are fixed
      if (this.recipient[key]) {
        this.setKeyAndValue(key, this.recipient[key]);
      }
    }
    for (const key of Object.keys(this.recipient.paTableAttributes)) {
      const question = this.program.programQuestions.find(
        (q) => q.name === key,
      );
      if (question && this.recipient.paTableAttributes[key]) {
        this.setKeyAndValue(key, this.recipient.paTableAttributes[key].value);
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

  private setKeyAndValue(key: string, value: string, type?: AnswerType) {
    if (type === AnswerType.Date || this.dateKeys.includes(key)) {
      value = this.datePipe.transform(value, this.formatString);
    }

    if (this.valueTranslators[key]) {
      value = this.translate.instant(`${this.valueTranslators[key]}.${value}`);
    }
    this.keysAnswersMap[key] = value;
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
