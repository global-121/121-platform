import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { OnlyAllowedInputDirective } from '../directives/only-allowed-input.directive';
import { DateInputComponent } from './date-input/date-input.component';
import { DialogueTurnComponent } from './dialogue-turn/dialogue-turn.component';
import { MoreInfoButtonComponent } from './more-info-button/more-info-button.component';
import { NumericInputComponent } from './numeric-input/numeric-input.component';
import { PhoneNumberInputComponent } from './phone-number-input/phone-number-input.component';
import { QAndASetComponent } from './q-and-a-set/q-and-a-set.component';

@NgModule({
  declarations: [
    DateInputComponent,
    DialogueTurnComponent,
    MoreInfoButtonComponent,
    NumericInputComponent,
    OnlyAllowedInputDirective,
    PhoneNumberInputComponent,
    QAndASetComponent,
  ],
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  exports: [
    DialogueTurnComponent,
    NumericInputComponent,
    MoreInfoButtonComponent,
    PhoneNumberInputComponent,
    DateInputComponent,
    QAndASetComponent,
    TranslateModule,
  ],
})
export class SharedModule {}
