import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HomePage } from './home.page';
import { ProgramsListComponent } from '../programs-list/programs-list.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: HomePage
      }
    ]),
    TranslateModule.forChild()
  ],
  declarations: [
    HomePage,
    ProgramsListComponent,
  ]
})
export class HomePageModule { }
