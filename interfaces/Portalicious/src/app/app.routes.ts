import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { Routes } from '@angular/router';
import { authGuard, projectPermissionsGuard } from '~/auth.guard';
import { ChangePasswordComponent } from '~/pages/change-password/change-password.component';
import { LoginComponent } from '~/pages/login/login.component';
import { ProjectMonitoringComponent } from '~/pages/project/project-monitoring/project-monitoring.component';
import { ProjectPaymentsComponent } from '~/pages/project/project-payments/project-payments.component';
import { ProjectRegistrationsComponent } from '~/pages/project/project-registrations/project-registrations.component';
import { ProjectTeamComponent } from '~/pages/project/project-team/project-team.component';
import { ProjectsOverviewComponent } from '~/pages/projects-overview/projects-overview.component';
import { RolesAndPermissionsComponent } from '~/pages/roles-and-permissions/roles-and-permissions.component';
import { UsersComponent } from '~/pages/users/users.component';

export enum AppRoutes {
  changePassword = 'change-password',
  login = 'login',
  project = 'project',
  projectMonitoring = 'monitoring',
  projectPayments = 'payments',
  projectRegistration = 'registration',
  projectRegistrations = 'registrations',
  projects = 'projects',
  projectTeam = 'team',
  rolesAndPermissions = 'roles-and-permissions',
  users = 'users',
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
    path: `${AppRoutes.project}/:projectId`,
    canActivate: [authGuard],
    children: [
      {
        path: AppRoutes.projectMonitoring,
        component: ProjectMonitoringComponent,
        canActivate: [
          projectPermissionsGuard(PermissionEnum.ProgramMetricsREAD),
        ],
      },
      {
        path: AppRoutes.projectTeam,
        component: ProjectTeamComponent,
        canActivate: [
          projectPermissionsGuard(PermissionEnum.AidWorkerProgramREAD),
        ],
      },
      {
        path: AppRoutes.projectRegistrations,
        component: ProjectRegistrationsComponent,
      },
      { path: AppRoutes.projectPayments, component: ProjectPaymentsComponent },
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
