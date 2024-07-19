import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MakePaymentComponent } from 'src/app/program/make-payment/make-payment.component';
import { PaymentHistoryPopupComponent } from 'src/app/program/payment-history-popup/payment-history-popup.component';
import { PaymentStatusPopupComponent } from 'src/app/program/payment-status-popup/payment-status-popup.component';
import { ProgramPayoutComponent } from 'src/app/program/program-payout/program-payout.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DownloadCbeVerificationReportComponent } from '../../components/download-cbe-verification-report/download-cbe-verification-report.component';
import { SubmitPaymentPopupComponent } from '../../program/submit-payment-popup/submit-payment-popup.component';
import { PaymentPage } from './payment.page';

const routes: Routes = [
  {
    path: '',
    component: PaymentPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes),
    PaymentHistoryPopupComponent,
    DownloadCbeVerificationReportComponent,
  ],
  declarations: [
    PaymentPage,
    ProgramPayoutComponent,
    MakePaymentComponent,
    PaymentStatusPopupComponent,
    SubmitPaymentPopupComponent,
  ],
})
export class PaymentPageModule {}
