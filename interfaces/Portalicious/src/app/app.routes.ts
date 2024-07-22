import { Routes } from '@angular/router';
import { AllProjectsComponent } from '~/pages/all-projects/all-projects.component';
import { ProgramMonitoringComponent } from '~/pages/program/program-monitoring/program-monitoring.component';
import { ProgramOverviewComponent } from '~/pages/program/program-overview/program-overview.component';
import { ProgramPaymentsComponent } from '~/pages/program/program-payments/program-payments.component';
import { ProgramRegistrationsComponent } from '~/pages/program/program-registrations/program-registrations.component';
import { ProgramTeamComponent } from '~/pages/program/program-team/program-team.component';
import { RolesAndPermissionsComponent } from '~/pages/roles-and-permissions/roles-and-permissions.component';
import { UserSettingsComponent } from '~/pages/user-settings/user-settings.component';
import { UsersComponent } from '~/pages/users/users.component';

export enum AppRoutes {
  allProjects = 'all-projects',
  program = 'program',
  programMonitoring = 'monitoring',
  programOverview = 'overview',
  programPayments = 'payments',
  programRegistrations = 'registrations',
  programTeam = 'team',
  rolesAndPermissions = 'roles-and-permissions',
  users = 'users',
  userSettings = 'user-settings',
}

export const routes: Routes = [
  { path: AppRoutes.allProjects, component: AllProjectsComponent },
  { path: AppRoutes.users, component: UsersComponent },
  { path: AppRoutes.userSettings, component: UserSettingsComponent },
  {
    path: AppRoutes.rolesAndPermissions,
    component: RolesAndPermissionsComponent,
  },
  {
    path: `${AppRoutes.program}/:programId`,
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
  { path: '', redirectTo: `/${AppRoutes.allProjects}`, pathMatch: 'full' },
];
