import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ProgramTeamTable } from 'src/app/program/program-team/program-team-table/program-team-table/program-team-table.component';
import { ProgramTeamPage } from 'src/app/program/program-team/program-team/program-team.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AidWorkersPage } from './aid-workers.page';

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
    ProgramTeamTable,
    RouterModule.forChild(routes),
  ],
  declarations: [AidWorkersPage, ProgramTeamPage],
})
export class AidWorkersPageModule {}
