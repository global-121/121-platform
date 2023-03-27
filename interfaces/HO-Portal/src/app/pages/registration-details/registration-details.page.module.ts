import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RegistrationActivityOverviewComponent } from 'src/app/components/registration-activity-overview/registration-activity-overview.component';
import { RegistrationPageTableComponent } from 'src/app/components/registration-page-table/registration-page-table.component';
import { RegistrationPaymentOverviewComponent } from 'src/app/components/registration-payment-overview/registration-payment-overview.component';
import { RegistrationPersonalInformationComponent } from 'src/app/components/registration-personal-information/registration-personal-information.component';
import { SharedModule } from '../../shared/shared.module';
import { RegistrationDetailsPage } from './registration-details.page';

const routes: Routes = [
  {
    path: '',
    component: RegistrationDetailsPage,
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
    RegistrationDetailsPage,
    RegistrationPersonalInformationComponent,
    RegistrationPageTableComponent,
    RegistrationPaymentOverviewComponent,
    RegistrationActivityOverviewComponent,
  ],
})
export class RegistrationDetailsModule {}
