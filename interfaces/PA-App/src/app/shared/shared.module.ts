import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { DialogueTurnComponent } from './dialogue-turn/dialogue-turn.component';

@NgModule({
  declarations: [
    DialogueTurnComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
  ],
  exports: [
    DialogueTurnComponent,
  ],
})
export class SharedModule { }
