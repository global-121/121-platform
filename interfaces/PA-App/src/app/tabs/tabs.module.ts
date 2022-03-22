import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { MultipleRegistrationsMenuComponent } from './../multiple-registrations-menu/multiple-registrations-menu.component';
import { TabsPage } from './tabs.page';
import { TabsPageRoutingModule } from './tabs.router.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    TranslateModule.forChild(),
  ],
  declarations: [
    TabsPage,
    UserMenuComponent,
    MultipleRegistrationsMenuComponent,
  ],
})
export class TabsPageModule {}
