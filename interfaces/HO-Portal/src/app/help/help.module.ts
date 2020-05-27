import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { HelpPage } from './help.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: HelpPage,
      },
    ]),
    TranslateModule.forChild(),
  ],
  declarations: [HelpPage],
})
export class HelpPageModule {}
