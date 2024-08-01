import { Routes } from '@angular/router';
import { authGuard } from '~/auth.guard';
import { LoginComponent } from '~/pages/login/login.component';
import { ProgramMonitoringComponent } from '~/pages/program/program-monitoring/program-monitoring.component';
import { ProgramOverviewComponent } from '~/pages/program/program-overview/program-overview.component';
import { ProgramPaymentsComponent } from '~/pages/program/program-payments/program-payments.component';
import { ProgramRegistrationsComponent } from '~/pages/program/program-registrations/program-registrations.component';
import { ProgramTeamComponent } from '~/pages/program/program-team/program-team.component';
import { ProjectsOverviewComponent } from '~/pages/projects-overview/projects-overview.component';
import { RolesAndPermissionsComponent } from '~/pages/roles-and-permissions/roles-and-permissions.component';
import { UserSettingsComponent } from '~/pages/user-settings/user-settings.component';
import { UsersComponent } from '~/pages/users/users.component';

export enum AppRoutes {
  login = 'login',
  project = 'project',
  projectMonitoring = 'monitoring',
  projectOverview = 'overview',
  projectPayments = 'payments',
  projectRegistrations = 'registrations',
  projects = 'projects',
  projectTeam = 'team',
  rolesAndPermissions = 'roles-and-permissions',
  users = 'users',
  userSettings = 'user-settings',
}

export const routes: Routes = [
  {
    path: AppRoutes.login,
    component: LoginComponent,
  },
  {
    path: AppRoutes.projects,
    component: ProjectsOverviewComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.users,
    component: UsersComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.userSettings,
    title: $localize`:Browser-tab-title@@page-title-user-settings:Change password`,
    component: UserSettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.rolesAndPermissions,
    component: RolesAndPermissionsComponent,
    canActivate: [authGuard],
  },
  {
    path: `${AppRoutes.project}/:programId`,
    canActivate: [authGuard],
    children: [
      { path: AppRoutes.projectOverview, component: ProgramOverviewComponent },
      {
        path: AppRoutes.projectTeam,
        component: ProgramTeamComponent,
      },
      {
        path: AppRoutes.projectRegistrations,
        component: ProgramRegistrationsComponent,
      },
      { path: AppRoutes.projectPayments, component: ProgramPaymentsComponent },
      {
        path: AppRoutes.projectMonitoring,
        component: ProgramMonitoringComponent,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: AppRoutes.projectRegistrations,
      },
    ],
  },
  {
    path: AppRoutes.project,
    redirectTo: AppRoutes.projects,
    pathMatch: 'full',
  },
  { path: '', redirectTo: AppRoutes.projects, pathMatch: 'full' },
  {
    path: '**',
    redirectTo: AppRoutes.projects,
  },
];
