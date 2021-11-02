import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MakePaymentComponent } from 'src/app/program/make-payment/make-payment.component';
import { PaymentStatusPopupComponent } from 'src/app/program/payment-status-popup/payment-status-popup.component';
import { ProgramPayoutComponent } from 'src/app/program/program-payout/program-payout.component';
import { SharedModule } from 'src/app/shared/shared.module';
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
  ],
  declarations: [
    PaymentPage,
    ProgramPayoutComponent,
    MakePaymentComponent,
    PaymentStatusPopupComponent,
  ],
})
export class PaymentPageModule {}
