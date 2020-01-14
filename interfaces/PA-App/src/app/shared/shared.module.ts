import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { DialogueTurnComponent } from './dialogue-turn/dialogue-turn.component';
import { MoreInfoButtonComponent } from './more-info-button/more-info-button.component';

@NgModule({
  declarations: [
    DialogueTurnComponent,
    MoreInfoButtonComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule.forChild(),
  ],
  exports: [
    DialogueTurnComponent,
    MoreInfoButtonComponent,
    TranslateModule,
  ],
})
export class SharedModule { }
