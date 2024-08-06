import { Routes } from '@angular/router';
import { authGuard } from '~/auth.guard';
import { AllProjectsComponent } from '~/pages/all-projects/all-projects.component';
import { ChangePasswordComponent } from '~/pages/change-password/change-password.component';
import { LoginComponent } from '~/pages/login/login.component';
import { ProgramMonitoringComponent } from '~/pages/program/program-monitoring/program-monitoring.component';
import { ProgramOverviewComponent } from '~/pages/program/program-overview/program-overview.component';
import { ProgramPaymentsComponent } from '~/pages/program/program-payments/program-payments.component';
import { ProgramRegistrationsComponent } from '~/pages/program/program-registrations/program-registrations.component';
import { ProgramTeamComponent } from '~/pages/program/program-team/program-team.component';
import { RolesAndPermissionsComponent } from '~/pages/roles-and-permissions/roles-and-permissions.component';
import { UsersComponent } from '~/pages/users/users.component';

export enum AppRoutes {
  allProjects = 'all-projects',
  changePassword = 'change-password',
  login = 'login',
  program = 'program',
  programMonitoring = 'monitoring',
  programOverview = 'overview',
  programPayments = 'payments',
  programRegistrations = 'registrations',
  programTeam = 'team',
  rolesAndPermissions = 'roles-and-permissions',
  users = 'users',
}

export const routes: Routes = [
  {
    path: AppRoutes.login,
    component: LoginComponent,
  },
  {
    path: AppRoutes.allProjects,
    component: AllProjectsComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.users,
    component: UsersComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.changePassword,
    title: $localize`:Browser-tab-title@@page-title-change-password:Change password`,
    component: ChangePasswordComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.rolesAndPermissions,
    component: RolesAndPermissionsComponent,
    canActivate: [authGuard],
  },
  {
    path: `${AppRoutes.program}/:programId`,
    canActivate: [authGuard],
    children: [
      { path: AppRoutes.programOverview, component: ProgramOverviewComponent },
      {
        path: AppRoutes.programTeam,
        component: ProgramTeamComponent,
      },
      {
        path: AppRoutes.programRegistrations,
        component: ProgramRegistrationsComponent,
      },
      { path: AppRoutes.programPayments, component: ProgramPaymentsComponent },
      {
        path: AppRoutes.programMonitoring,
        component: ProgramMonitoringComponent,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: AppRoutes.programRegistrations,
      },
    ],
  },
  { path: '', redirectTo: AppRoutes.allProjects, pathMatch: 'full' },
  {
    path: '**',
    redirectTo: AppRoutes.allProjects,
  },
];
