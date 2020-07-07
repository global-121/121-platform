import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DesignPage } from './design.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProgramDetailsComponent } from 'src/app/program/program-details/program-details.component';
import { ProgramJsonComponent } from 'src/app/program/program-json/program-json.component';

const routes: Routes = [
  {
    path: '',
    component: DesignPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
  entryComponents: [ProgramJsonComponent],
  declarations: [DesignPage, ProgramDetailsComponent, ProgramJsonComponent],
})
export class DesignPageModule {}
