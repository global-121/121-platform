import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsListComponent } from '../programs-list/programs-list.component';
import { ProgramComponent } from './program.component';
import { ProgramPeopleComponent } from './program-people/program-people.component';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from '../auth/user-role.enum';

const programRoutes: Routes = [
  {
    path: 'program/:id',
    component: ProgramComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(programRoutes)],
  exports: [RouterModule]
})
export class ProgramsRoutingModule { }
