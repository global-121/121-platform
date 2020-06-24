import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';

import { InclusionPage } from './inclusion.page';
import { ProgramPeopleComponent } from 'src/app/program/program-people/program-people.component';
import { ExportInclusionComponent } from 'src/app/program/export-inclusion/export-inclusion.component';

const routes: Routes = [
  {
    path: '',
    component: InclusionPage,
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
  declarations: [
    InclusionPage,
    ProgramPeopleComponent,
    ExportInclusionComponent,
  ],
})
export class InclusionPageModule {}
