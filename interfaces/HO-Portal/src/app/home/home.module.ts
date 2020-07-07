import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramsListComponent } from '../programs-list/programs-list.component';
import { SharedModule } from '../shared/shared.module';
import { HomePage } from './home.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: HomePage,
      },
    ]),
    TranslateModule.forChild(),
  ],
  declarations: [HomePage, ProgramsListComponent],
})
export class HomePageModule {}
