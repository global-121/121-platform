import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { ProgramModalPage } from './program-modal.page';

const routes: Routes = [
  {
    path: '',
    component: ProgramModalPage
  }
];

@NgModule({
  declarations: [ProgramModalPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild()
  ],
  entryComponents: [ProgramModalPage]
})
export class ProgramModalPageModule { }
