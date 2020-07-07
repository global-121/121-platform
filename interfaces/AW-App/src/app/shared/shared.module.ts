import { PhoneNumberInputComponent } from './phone-number-input/phone-number-input.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { DialogueTurnComponent } from './dialogue-turn/dialogue-turn.component';
import { QAndASetComponent } from './q-and-a-set/q-and-a-set.component';

@NgModule({
  declarations: [
    DialogueTurnComponent,
    PhoneNumberInputComponent,
    QAndASetComponent,
  ],
  imports: [CommonModule, IonicModule, TranslateModule.forChild()],
  exports: [
    DialogueTurnComponent,
    PhoneNumberInputComponent,
    QAndASetComponent,
    TranslateModule,
  ],
})
export class SharedModule {}
