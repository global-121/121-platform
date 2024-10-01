import { Routes } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { authGuard } from '~/guards/auth.guard';
import { organizationAdminGuard } from '~/guards/organization-admin.guard';
import { projectPermissionsGuard } from '~/guards/project-permissions-guard';
import { ChangePasswordPageComponent } from '~/pages/change-password/change-password.page';
import { LoginPageComponent } from '~/pages/login/login.page';
import { ProjectMonitoringPageComponent } from '~/pages/project/project-monitoring/project-monitoring.page';
import { ProjectPaymentsPageComponent } from '~/pages/project/project-payments/project-payments.page';
import { ProjectRegistrationActivityLogPageComponent } from '~/pages/project/project-registrations/project-registration-activity-log/project-registration-activity-log.page';
import { ProjectRegistrationDebitCardsPageComponent } from '~/pages/project/project-registrations/project-registration-debit-cards/project-registration-debit-cards.page';
import { ProjectRegistrationPersonalInformationPageComponent } from '~/pages/project/project-registrations/project-registration-personal-information/project-registration-personal-information.page';
import { ProjectRegistrationsPageComponent } from '~/pages/project/project-registrations/project-registrations.page';
import { ProjectTeamPageComponent } from '~/pages/project/project-team/project-team.page';
import { ProjectsOverviewPageComponent } from '~/pages/projects-overview/projects-overview.page';
import { UserRolesPageComponent } from '~/pages/user-roles/user-roles.page';
import { UsersPageComponent } from '~/pages/users/users.page';

export enum AppRoutes {
  changePassword = 'change-password',
  login = 'login',
  project = 'project',
  projectMonitoring = 'monitoring',
  projectPayments = 'payments',
  projectRegistrationActivityLog = 'activity-log',
  projectRegistrationDebitCards = 'debit-cards',
  projectRegistrationPersonalInformation = 'personal-information',
  projectRegistrations = 'registrations',
  projects = 'projects',
  projectTeam = 'team',
  userRoles = 'user-roles',
  users = 'users',
}

export const routes: Routes = [
  {
    path: AppRoutes.login,
    component: LoginPageComponent,
  },
  {
    path: AppRoutes.changePassword,
    title: $localize`:Browser-tab-title@@page-title-change-password:Change password`,
    component: ChangePasswordPageComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.projects,
    component: ProjectsOverviewPageComponent,
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.users,
    component: UsersPageComponent,
    canActivate: [authGuard, organizationAdminGuard],
  },
  {
    path: AppRoutes.userRoles,
    component: UserRolesPageComponent,
    canActivate: [authGuard, organizationAdminGuard],
  },
  {
    path: `${AppRoutes.project}/:projectId`,
    canActivate: [authGuard],
    children: [
      {
        path: AppRoutes.projectMonitoring,
        component: ProjectMonitoringPageComponent,
        canActivate: [
          projectPermissionsGuard(PermissionEnum.ProgramMetricsREAD),
        ],
      },
      {
        path: AppRoutes.projectTeam,
        component: ProjectTeamPageComponent,
        canActivate: [
          projectPermissionsGuard(PermissionEnum.AidWorkerProgramREAD),
        ],
      },
      {
        path: AppRoutes.projectRegistrations,
        children: [
          {
            path: ``,
            component: ProjectRegistrationsPageComponent,
          },
          {
            path: `:registrationId/${AppRoutes.projectRegistrationActivityLog}`,
            component: ProjectRegistrationActivityLogPageComponent,
          },
          {
            path: `:registrationId/${AppRoutes.projectRegistrationPersonalInformation}`,
            component: ProjectRegistrationPersonalInformationPageComponent,
          },
          {
            path: `:registrationId/${AppRoutes.projectRegistrationDebitCards}`,
            component: ProjectRegistrationDebitCardsPageComponent,
          },
          {
            path: `:registrationId`,
            pathMatch: 'full',
            redirectTo: `:registrationId/${AppRoutes.projectRegistrationActivityLog}`,
          },
        ],
      },
      {
        path: AppRoutes.projectPayments,
        component: ProjectPaymentsPageComponent,
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
