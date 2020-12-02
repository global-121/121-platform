import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HelpPage } from 'src/app/help/help.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReferralPage } from './referral.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ReferralPage }]),
    SharedModule,
  ],
  declarations: [ReferralPage, HelpPage],
  entryComponents: [HelpPage],
  providers: [Title],
})
export class ReferralPageModule {}
