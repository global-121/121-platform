import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramListComponent } from './program-list/program-list.component';
import { ProgramDetailsComponent } from './program-details/program-details.component';
import { AuthGuard } from '../auth/auth.guard';

const programRoutes: Routes = [
  {
    path: 'programs',
    component: ProgramListComponent,
    canActivate: [AuthGuard],

  },
  {
    path: 'program/:id',
    component: ProgramDetailsComponent,
    canActivate: [AuthGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(programRoutes)],
  exports: [RouterModule]
})
export class ProgramsRoutingModule { }
