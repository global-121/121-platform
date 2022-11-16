import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { RecipientDetailsComponent } from './components/recipient-details/recipient-details.component';
import { RecipientPage } from './recipient.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: 'recipient',
        component: RecipientPage,
      },
    ]),
    TranslateModule.forChild(),
  ],
  declarations: [RecipientPage, RecipientDetailsComponent],
})
export class IframeModule {}
