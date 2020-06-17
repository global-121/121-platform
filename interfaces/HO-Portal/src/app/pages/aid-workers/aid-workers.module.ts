import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AidWorkersPage } from './aid-workers.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { ManageAidworkersComponent } from 'src/app/program/manage-aidworkers/manage-aidworkers.component';

const routes: Routes = [
  {
    path: '',
    component: AidWorkersPage,
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
  declarations: [AidWorkersPage, ManageAidworkersComponent],
})
export class AidWorkersPageModule {}
