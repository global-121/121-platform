import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmPromptComponent } from './confirm-prompt/confirm-prompt.component';
import { PasswordToggleInputComponent } from './password-toggle-input/password-toggle-input.component';
import { UserStateComponent } from '../components/user-state/user-state.component';
import { HeaderComponent } from '../components/header/header.component';

@NgModule({
  declarations: [
    ConfirmPromptComponent,
    PasswordToggleInputComponent,
    HeaderComponent,
    UserStateComponent,
  ],
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule.forChild()],
  exports: [
    ConfirmPromptComponent,
    PasswordToggleInputComponent,
    HeaderComponent,
    UserStateComponent,
    TranslateModule,
  ],
})
export class SharedModule {}
