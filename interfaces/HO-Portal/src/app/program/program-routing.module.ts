import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProgramComponent } from './program.component';
import { AuthGuard } from '../auth/auth.guard';

const programRoutes: Routes = [
  {
    path: 'program/:id',
    component: ProgramComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(programRoutes)],
  exports: [RouterModule],
})
export class ProgramsRoutingModule {}
