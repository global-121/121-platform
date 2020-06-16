import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { DialogueTurnComponent } from './dialogue-turn/dialogue-turn.component';
import { MoreInfoButtonComponent } from './more-info-button/more-info-button.component';
import { PasswordToggleInputComponent } from './password-toggle-input/password-toggle-input.component';
import { PhoneNumberInputComponent } from './phone-number-input/phone-number-input.component';
import { PlayTextAudioComponent } from './play-text-audio/play-text-audio.component';
import { QAndASetComponent } from './q-and-a-set/q-and-a-set.component';
import { QrScannerComponent } from './qr-scanner/qr-scanner.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@NgModule({
  declarations: [
    DialogueTurnComponent,
    MoreInfoButtonComponent,
    PasswordToggleInputComponent,
    PhoneNumberInputComponent,
    PlayTextAudioComponent,
    QAndASetComponent,
    QrScannerComponent,
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
    MoreInfoButtonComponent,
    PasswordToggleInputComponent,
    PhoneNumberInputComponent,
    PlayTextAudioComponent,
    QAndASetComponent,
    QrScannerComponent,
    TranslateModule,
  ],
})
export class SharedModule {}
