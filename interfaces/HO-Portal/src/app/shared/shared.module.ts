import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmPromptComponent } from './confirm-prompt/confirm-prompt.component';
import { PasswordToggleInputComponent } from './password-toggle-input/password-toggle-input.component';
import { UserStateComponent } from '../components/user-state/user-state.component';
import { HeaderComponent } from '../components/header/header.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { PhaseNextComponent } from '../program/phase-next/phase-next.component';

@NgModule({
  declarations: [
    ConfirmPromptComponent,
    PasswordToggleInputComponent,
    HeaderComponent,
    UserStateComponent,
    PhaseNextComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule,
    TranslateModule.forChild(),
    NgxDatatableModule,
  ],
  exports: [
    ConfirmPromptComponent,
    PasswordToggleInputComponent,
    HeaderComponent,
    UserStateComponent,
    PhaseNextComponent,
    RouterModule,
    TranslateModule,
    NgxDatatableModule,
  ],
})
export class SharedModule {}
