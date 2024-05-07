import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AppRoutes } from 'src/app/app-routes.enum';
import { BannerComponent } from '../../components/banner/banner.component';
import { RegistrationProfileComponent } from '../../components/registration-profile/registration-profile.component';
import { SharedModule } from '../../shared/shared.module';
import { RecipientPage } from './recipient.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: AppRoutes.iframeRecipient,
        component: RecipientPage,
      },
    ]),
    TranslateModule.forChild(),
    RegistrationProfileComponent,
  ],
  providers: [DatePipe],
  declarations: [RecipientPage, BannerComponent],
})
export class IframeModule {}
