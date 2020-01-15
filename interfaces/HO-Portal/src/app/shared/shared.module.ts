import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmPromptComponent } from './confirm-prompt/confirm-prompt.component';

@NgModule({
  declarations: [
    ConfirmPromptComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule.forChild(),
  ],
  exports: [
    ConfirmPromptComponent,
    TranslateModule,
  ],
})
export class SharedModule { }
