import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DialogueTurnComponent } from './dialogue-turn/dialogue-turn.component';
import { NumericInputComponent } from './numeric-input/numeric-input.component';
import { PhoneNumberInputComponent } from './phone-number-input/phone-number-input.component';
import { QAndASetComponent } from './q-and-a-set/q-and-a-set.component';
import { EmailInputComponent } from './email-input/email-input.component';

@NgModule({
  declarations: [
    DialogueTurnComponent,
    EmailInputComponent,
    NumericInputComponent,
    PhoneNumberInputComponent,
    QAndASetComponent,
  ],
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule.forChild()],
  exports: [
    DialogueTurnComponent,
    EmailInputComponent,
    NumericInputComponent,
    PhoneNumberInputComponent,
    QAndASetComponent,
    TranslateModule,
  ],
})
export class SharedModule {}
