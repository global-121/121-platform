import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';

import { RegistrationValidationPage } from './registration-validation.page';
import { ProgramPeopleAffectedComponent } from 'src/app/program/program-people-affected/program-people-affected.component';

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
  declarations: [RegistrationValidationPage, ProgramPeopleAffectedComponent],
})
export class RegistrationValidationPageModule {}
