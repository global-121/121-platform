import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentRowDetail, PayoutDetails } from 'src/app/models/payment.model';
import { Person } from 'src/app/models/person.model';
import { Program } from 'src/app/models/program.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { environment } from '../../../environments/environment';
import { RegistrationActivityDetailComponent } from '../../components/registration-activity-detail/registration-activity-detail.component';
import { RegistrationActivity } from '../../models/registration-activity.model';
import { PaymentHistoryAccordionComponent } from '../payment-history-accordion/payment-history-accordion.component';

@Component({
  selector: 'app-payment-history-popup',
  templateUrl: './payment-history-popup.component.html',
  styleUrls: ['./payment-history-popup.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    PaymentHistoryAccordionComponent,
    RegistrationActivityDetailComponent,
  ],
})
export class PaymentHistoryPopupComponent implements OnInit {
  @Input()
  public referenceId: string;

  @Input()
  public program: Program;

  @Input()
  public paymentRows: RegistrationActivity[] = [];

  @Input()
  private canViewPersonalData = false;

  @Input()
  private canViewPaymentData = false;

  @Input()
  public canViewVouchers = false;

  @Input()
  private canDoSinglePayment = false;

  public person: Person;
  public firstPaymentToShow = 1;
  public lastPaymentId: number;
  public content: any;
  public payoutDetails: PayoutDetails;
  public paymentInProgress = false;
  public isInProgress = false;
  public paDisplayName: string;
  private programId: number;
  public locale: string;

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private pastPaymentsService: PastPaymentsService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  async ngOnInit() {
    this.programId = this.program?.id;
    await this.getPersonData();
    this.paDisplayName = this.person?.personAffectedSequence;

    if (this.canViewPersonalData) {
      this.paDisplayName = this.person?.name;
    }

    if (this.canViewPaymentData) {
      this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
        this.programId,
      );
      this.paymentRows = await this.pastPaymentsService.getPaymentActivity(
        this.program,
        this.person,
        this.canDoSinglePayment,
      );
      this.paymentRows.reverse();
    }
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

  public closeModal() {
    this.modalController.dismiss();
  }

  public resetProgress(): void {
    this.isInProgress = false;
  }

  public hasError(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.hasError(paymentRow);
  }

  public hasWaiting(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.hasWaiting(paymentRow);
  }

  public hasVoucherSupport(fsp: string): boolean {
    return PaymentUtils.hasVoucherSupport(fsp);
  }

  public enableSinglePayment(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.enableSinglePayment(
      paymentRow,
      this.canDoSinglePayment,
      this.person.status,
      this.lastPaymentId,
      this.paymentInProgress,
    );
  }
}
