import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ProgramTeamPopupComponent } from 'src/app/program/program-team/program-team-popup/program-team-popup.component';
import { ProgramTeamTableComponent } from 'src/app/program/program-team/program-team-table/program-team-table.component';
import { ProgramTeamComponent } from 'src/app/program/program-team/program-team.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { TeamPage } from './team.page';

const routes: Routes = [
  {
    path: '',
    component: TeamPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    ProgramTeamTableComponent,
    ProgramTeamPopupComponent,
    RouterModule.forChild(routes),
  ],
  declarations: [TeamPage, ProgramTeamComponent],
})
export class AidWorkersPageModule {}
