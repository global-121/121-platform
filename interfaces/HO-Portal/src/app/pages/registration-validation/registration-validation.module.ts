import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExportDuplicatesPopupComponent } from '../../program/export-duplicates-popup/export-duplicates-popup.component';
import { RegistrationValidationPage } from './registration-validation.page';

const routes: Routes = [
  {
    path: '',
    component: RegistrationValidationPage,
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
  declarations: [RegistrationValidationPage, ExportDuplicatesPopupComponent],
})
export class RegistrationValidationPageModule {}
