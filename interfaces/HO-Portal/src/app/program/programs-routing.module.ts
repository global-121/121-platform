import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramsListComponent } from '../programs-list/programs-list.component';
import { ProgramComponent } from './program.component';
import { ProgramPeopleComponent } from './program-people/program-people.component';
import { AuthGuard } from '../auth/auth.guard';
import { UserRole } from '../auth/user-role.enum';

const programRoutes: Routes = [
  {
    path: 'programs',
    component: ProgramsListComponent,
    canActivate: [AuthGuard],

  },
  {
    path: 'program/:id',
    component: ProgramComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'program/:id/people',
    component: ProgramPeopleComponent,
    canActivate: [AuthGuard],
    data: {
      roles: [UserRole.ProgramManager]
    },
  },
  {
    path: 'program/:id/people-privacy',
    component: ProgramPeopleComponent,
    data: {
      showSensitiveData: true,
      roles: [UserRole.PrivacyOfficer]
    },
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(programRoutes)],
  exports: [RouterModule]
})
export class ProgramsRoutingModule { }
