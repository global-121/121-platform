import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RecipientDetailsComponent } from '../components/recipient-details/recipient-details.component';
import { SharedModule } from '../shared/shared.module';
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
  providers: [DatePipe],
  declarations: [RecipientPage, RecipientDetailsComponent],
})
export class IframeModule {}
