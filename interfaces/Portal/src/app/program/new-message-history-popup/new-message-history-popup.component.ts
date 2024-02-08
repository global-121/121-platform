import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
//import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Message, MessageStatusMapping } from '../../models/message.model';
//import { PaymentRowDetail, PayoutDetails } from 'src/app/models/payment.model';
import { Person } from 'src/app/models/person.model';
import { environment } from '../../../environments/environment';
//import { Program } from 'src/app/models/program.model';
//import { Transaction } from 'src/app/models/transaction.model';
//import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
//import { PaymentUtils } from 'src/app/shared/payment.utils';
import { MessageHistoryItemComponent } from '../message-history-item/message-history-item.component';
//import { StatusEnum } from '../../models/status.enum';

@Component({
  selector: 'app-new-message-history-popup',
  templateUrl: './new-message-history-popup.component.html',
  styleUrls: ['./new-message-history-popup.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    MessageHistoryItemComponent,
  ],
})
export class NewMessageHistoryPopupComponent implements OnInit {
  @Input()
  public referenceId: string;

  @Input()
  public programId: number;

  // @Input()
  // public program: Program;
  // @Input()
  // public paymentRows: PaymentRowDetail[] = [];
  // @Input()
  // private canViewPersonalData = false;
  // @Input()
  // private canViewPaymentData = false;
  // @Input()
  // public canViewVouchers = false;
  // @Input()
  // private canDoSinglePayment = false;

  // public person: Person;
  // public firstPaymentToShow = 1;
  // public lastPaymentId: number;
  // public content: any;
  // public payoutDetails: PayoutDetails;
  // public paymentInProgress = false;
  // public isInProgress = false;
  // public paDisplayName: string;
  // private programId: number;
  // private pastTransactions: Transaction[] = [];

  // TODO: Why are these variables public?
  public person: Person;
  public DateFormat = DateFormat;
  public messageHistory: Message[];
  public historySize = 5;
  public trimBodyLength = 20;
  public imageString = '(image)';
  public rowIndex: number;
  public chipStatus = MessageStatusMapping;
  public errorCodeUrl = `${environment.twilio_error_codes_url}/`;

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    // TODO: Do we need the translate service?
    //private translate: TranslateService,
    //private pastPaymentsService: PastPaymentsService,
  ) {}

  async ngOnInit() {
    await this.getPersonData();
    //this.paDisplayName = this.person?.personAffectedSequence;
    this.getMessageHistory();

    // if (this.canViewPersonalData) {
    //   this.paDisplayName = this.person?.name;
    // }

    // if (this.canViewPaymentData) {
    //   this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
    //     this.programId,
    //   );
    //   this.pastTransactions = await this.programsService.getTransactions(
    //     this.programId,
    //     this.person?.referenceId,
    //   );
    //   this.fillPaymentRows();
    //   this.paymentRows.reverse();
    // }
  }

  private async getPersonData() {
    const res = await this.programsService.getPeopleAffected(
      this.programId,
      1,
      1,
      this.referenceId,
    );
    this.person = res.data[0];
  }

  private async getMessageHistory() {
    this.messageHistory = await this.programsService.retrieveMsgHistory(
      this.programId,
      this.referenceId,
    );
  }

  // TODO: What is this for and where is it used?
  public async loadMore(historyLength) {
    this.historySize = historyLength;
  }

  // TODO: What is this for and where is it used?
  public openMessageDetails(index) {
    if (index === this.rowIndex) {
      this.rowIndex = null;
    } else {
      this.rowIndex = index;
    }
  }

  // Call to close the pop-up
  public closeModal() {
    this.modalController.dismiss();
  }

  // public resetProgress(): void {
  //   this.isInProgress = false;
  // }

  // public hasError(paymentRow: PaymentRowDetail): boolean {
  //   return PaymentUtils.hasError(paymentRow);
  // }

  // public hasWaiting(paymentRow: PaymentRowDetail): boolean {
  //   return PaymentUtils.hasWaiting(paymentRow);
  // }

  // public hasVoucherSupport(fsp: string): boolean {
  //   return PaymentUtils.hasVoucherSupport(fsp);
  // }

  // public enableSinglePayment(paymentRow: PaymentRowDetail): boolean {
  //   return PaymentUtils.enableSinglePayment(
  //     paymentRow,
  //     this.canDoSinglePayment,
  //     this.person.status,
  //     this.lastPaymentId,
  //     this.paymentInProgress,
  //   );
  // }

  // private fillPaymentRows() {
  //   const nrOfPayments = this.program?.distributionDuration;
  //   const lastPaymentToShow = Math.min(this.lastPaymentId, nrOfPayments);

  //   for (
  //     let index = this.firstPaymentToShow;
  //     index <= lastPaymentToShow;
  //     index++
  //   ) {
  //     const transaction = PaymentUtils.getTransactionOfPaymentForRegistration(
  //       index,
  //       this.person.referenceId,
  //       this.pastTransactions,
  //     );
  //     let paymentRowValue: PaymentRowDetail = {
  //       paymentIndex: index,
  //       text: '',
  //     };
  //     if (!transaction) {
  //       paymentRowValue.text = this.translate.instant(
  //         'page.program.program-people-affected.transaction.do-single-payment',
  //       );
  //     } else {
  //       paymentRowValue = PaymentUtils.getPaymentRowInfo(
  //         transaction,
  //         this.program,
  //         index,
  //       );
  //       if (transaction.status === StatusEnum.success) {
  //         /* empty */
  //       } else if (transaction.status === StatusEnum.waiting) {
  //         paymentRowValue.errorMessage = this.translate.instant(
  //           'page.program.program-people-affected.transaction.waiting-message',
  //         );
  //         paymentRowValue.waiting = true;
  //       } else {
  //         paymentRowValue.errorMessage = transaction.errorMessage;
  //       }

  //       paymentRowValue.status = transaction.status;
  //     }
  //     if (
  //       paymentRowValue.transaction ||
  //       PaymentUtils.enableSinglePayment(
  //         paymentRowValue,
  //         this.canDoSinglePayment,
  //         this.person.status,
  //         this.lastPaymentId,
  //         false,
  //       )
  //     ) {
  //       this.paymentRows.push(paymentRowValue);
  //     }
  //   }
  // }

}
