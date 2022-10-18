import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { OnlyAllowedInputDirective } from '../directives/only-allowed-input.directive';
import { DateInputComponent } from './date-input/date-input.component';
import { DialogueTurnComponent } from './dialogue-turn/dialogue-turn.component';
import { MoreInfoButtonComponent } from './more-info-button/more-info-button.component';
import { NumericInputComponent } from './numeric-input/numeric-input.component';
import { PasswordToggleInputComponent } from './password-toggle-input/password-toggle-input.component';
import { PhoneNumberInputComponent } from './phone-number-input/phone-number-input.component';
import { PlayTextAudioComponent } from './play-text-audio/play-text-audio.component';
import { QAndASetComponent } from './q-and-a-set/q-and-a-set.component';

@NgModule({
  declarations: [
    DateInputComponent,
    DialogueTurnComponent,
    MoreInfoButtonComponent,
    NumericInputComponent,
    OnlyAllowedInputDirective,
    PasswordToggleInputComponent,
    PhoneNumberInputComponent,
    PlayTextAudioComponent,
    QAndASetComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ZXingScannerModule,
    TranslateModule.forChild(),
  ],
  exports: [
    DialogueTurnComponent,
    NumericInputComponent,
    MoreInfoButtonComponent,
    PasswordToggleInputComponent,
    PhoneNumberInputComponent,
    DateInputComponent,
    PlayTextAudioComponent,
    QAndASetComponent,
    TranslateModule,
  ],
})
export class SharedModule {}
