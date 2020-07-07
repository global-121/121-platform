import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { ValidationComponentsModule } from '../validation-components/validation-components.module';
import { ValidationPage } from './validation.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ValidationPage }]),
    SharedModule,
    ValidationComponentsModule,
  ],
  declarations: [ValidationPage],
})
export class ValidationPageModule {}
