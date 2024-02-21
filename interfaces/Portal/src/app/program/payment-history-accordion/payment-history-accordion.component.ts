import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import {
  PaymentRowDetail,
  PayoutDetails,
  SinglePayoutDetails,
} from '../../models/payment.model';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import {
  RegistrationActivity,
  RegistrationActivityType,
} from '../../models/registration-activity.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { PaymentStatusPopupComponent } from '../payment-status-popup/payment-status-popup.component';
@Component({
  selector: 'app-payment-history-accordion',
  templateUrl: './payment-history-accordion.component.html',
  styleUrls: ['./payment-history-accordion.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, TranslateModule],
})
export class PaymentHistoryAccordionComponent implements OnInit {
  DateFormat = DateFormat;
  hasErrorCheck = PaymentUtils.hasError;
  hasWaitingCheck = PaymentUtils.hasError;
  hasVoucherSupportCheck = PaymentUtils.hasVoucherSupport;
  getCustomDataAttributesCheck = PaymentUtils.getCustomDataAttributesToShow;

  @Input()
  public activity: RegistrationActivity;

  @Input()
  public enableSinglePayment?: any;

  @Input()
  public person?: Person;

  @Input()
  public program?: Program;

  @Input()
  private canViewVouchers? = false;

  @Input()
  private canDoSinglePayment? = false;

  @Input()
  private lastPaymentId?: number;

  RegistrationActivityType = RegistrationActivityType;

  public showAccordion = false;

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}
  ngOnInit(): void {
    if (
      (this.activity.type === RegistrationActivityType.payment &&
        !this.enableSinglePayment) ||
      this.activity.type === RegistrationActivityType.message
    ) {
      this.showAccordion = true;
    }
  }

  public async rowClick(paymentRow: PaymentRowDetail) {
    let voucherUrl = null;
    let voucherButtons = null;
    let showRetryButton = false;
    let doSinglePaymentDetails: SinglePayoutDetails = null;
    let paymentDetails: PayoutDetails = null;
    const hasWaiting = PaymentUtils.hasWaiting(paymentRow);
    const hasError = PaymentUtils.hasError(paymentRow);
    const isSinglePayment = PaymentUtils.enableSinglePayment(
      paymentRow,
      this.canDoSinglePayment,
      this.person.status,
      this.lastPaymentId,
      false,
    );

    if (
      !PaymentUtils.hasVoucherSupport(paymentRow.fsp) &&
      !hasError &&
      !isSinglePayment
    ) {
      return;
    }

    const content = hasWaiting
      ? paymentRow.errorMessage
      : hasError
        ? this.translate.instant(
            'page.program.program-people-affected.payment-status-popup.error-message',
          ) +
          ': <strong>' +
          paymentRow.errorMessage +
          '</strong><br><br>' +
          this.translate.instant(
            'page.program.program-people-affected.payment-status-popup.fix-error',
          )
        : isSinglePayment
          ? this.translate.instant(
              'page.program.program-people-affected.payment-status-popup.single-payment.intro',
            )
          : null;

    if (
      this.canViewVouchers &&
      PaymentUtils.hasVoucherSupport(paymentRow.fsp) &&
      !!paymentRow.transaction
    ) {
      await this.programsService
        .exportVoucher(
          this.person.referenceId,
          paymentRow.paymentIndex,
          this.program.id,
        )
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
    }
    if (paymentRow.transaction) {
      paymentDetails = {
        programId: this.program.id,
        payment: paymentRow.paymentIndex,
        amount: paymentRow.transaction.amount,
        referenceId: this.person.referenceId,
        paNr: this.person.id,
        currency: this.program.currency,
      };
    }
    if (this.canDoSinglePayment) {
      showRetryButton = !hasWaiting && hasError;
      doSinglePaymentDetails = {
        paNr: this.person.personAffectedSequence,
        amount: this.program.fixedTransferValue,
        currency: this.program.currency,
        multiplier: this.person.paymentAmountMultiplier
          ? this.person.paymentAmountMultiplier
          : 1,
        programId: this.program.id,
        payment: paymentRow.paymentIndex,
        referenceId: this.person.referenceId,
      };
    }
    const titleSinglePayment = isSinglePayment ? paymentRow.text : null;

    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentStatusPopupComponent,
      componentProps: {
        titleSinglePayment,
        content,
        showRetryButton,
        payoutDetails: paymentDetails,
        singlePayoutDetails: doSinglePaymentDetails,
        voucherButtons,
        imageUrl: voucherUrl,
        program: this.program,
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
