import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import RegistrationStatus from 'src/app/enums/registration-status.enum';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { PaymentHistoryPopupComponent } from '../../program/payment-history-popup/payment-history-popup.component';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import {
  RegistrationPageTableComponent,
  TableItem,
} from '../registration-page-table/registration-page-table.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RegistrationPageTableComponent,
  ],
  selector: 'app-registration-payment-overview',
  templateUrl: './registration-payment-overview.component.html',
  styleUrls: ['./registration-payment-overview.component.scss'],
})
export class RegistrationPaymentOverviewComponent implements OnInit {
  @Input()
  private person: Person;

  @Input()
  private program: Program;

  @Input()
  public paymentsTable: TableItem[];

  private PAYMENTS_TABLE_LENGTH = 4;

  private canViewPersonalData: boolean;
  private canViewPaymentData: boolean;
  private canViewVouchers: boolean;
  private canDoSinglePayment: boolean;

  constructor(
    private translate: TranslateService,
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    if (!this.person || !this.program) {
      return;
    }

    this.loadPermissions();

    this.fillPaymentsTable();
  }

  private async fillPaymentsTable() {
    this.paymentsTable = [];
    const minPayment = this.person.payment || 1;

    const payments = (
      await this.programsService.getTransactions(
        this.program.id,
        minPayment,
        this.person?.referenceId,
      )
    ).slice(0, this.person.maxPayments || this.PAYMENTS_TABLE_LENGTH);

    const itemLabel = (paymentNumber) =>
      this.translate.instant(
        'registration-details.payment-overview.paymentLabel',
        {
          number: paymentNumber,
        },
      );

    const itemValue = (status) =>
      this.translate.instant(
        'page.program.program-people-affected.transaction.' + status,
      );

    this.paymentsTable = payments.map((p) => ({
      label: itemLabel(p.payment),
      value: itemValue(p.status),
    }));

    for (let i = payments.length; i < this.PAYMENTS_TABLE_LENGTH; i++) {
      const paymentNumber = minPayment + i;

      if (this.person.maxPayments && paymentNumber > this.person.maxPayments) {
        break;
      }

      this.paymentsTable.push({
        label: itemLabel(paymentNumber),
        value: itemValue('planned'),
      });
    }

    const itemPaymentNumber = (s) => Number(s.split('#')[1]);
    this.paymentsTable.sort(
      (a, b) => itemPaymentNumber(b.label) - itemPaymentNumber(a.label),
    );
  }

  public async paymentHistoryPopup() {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentHistoryPopupComponent,
      componentProps: {
        person: this.person,
        program: this.program,
        canViewPersonalData: this.canViewPersonalData,
        canViewPaymentData: this.canViewPaymentData,
        canViewVouchers: this.canViewVouchers,
        canDoSinglePayment: this.canDoSinglePayment,
      },
    });
    await modal.present();
  }

  public showPaymentInfo(): boolean {
    const acceptedStatuses = [
      RegistrationStatus.included,
      RegistrationStatus.completed,
      RegistrationStatus.inclusionEnded,
      RegistrationStatus.rejected,
    ];

    if (!this.person) {
      return false;
    }

    if (
      acceptedStatuses.includes(this.person.status) &&
      this.canViewPaymentData
    ) {
      return true;
    }

    return false;
  }

  private loadPermissions() {
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationPersonalREAD],
    );
    this.canViewPaymentData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );
    this.canViewVouchers = this.authService.hasAllPermissions(this.program.id, [
      Permission.PaymentVoucherREAD,
    ]);
    this.canDoSinglePayment = this.authService.hasAllPermissions(
      this.program.id,
      [
        Permission.ActionREAD,
        Permission.PaymentCREATE,
        Permission.PaymentREAD,
        Permission.PaymentTransactionREAD,
      ],
    );
  }
}
