import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmPromptComponent } from './confirm-prompt/confirm-prompt.component';
import { PasswordToggleInputComponent } from './password-toggle-input/password-toggle-input.component';

@NgModule({
  declarations: [ConfirmPromptComponent, PasswordToggleInputComponent],
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule.forChild()],
  exports: [
    ConfirmPromptComponent,
    PasswordToggleInputComponent,
    TranslateModule,
  ],
})
export class SharedModule {}
