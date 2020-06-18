import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { PaymentPage } from './payment.page';
import { ProgramPayoutComponent } from 'src/app/program/program-payout/program-payout.component';

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
  declarations: [PaymentPage, ProgramPayoutComponent],
})
export class PaymentPageModule {}
