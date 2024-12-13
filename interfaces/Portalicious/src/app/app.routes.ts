import { Routes } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { authGuard } from '~/guards/auth.guard';
import { authCapabilitiesGuard } from '~/guards/auth-capabilities.guard';
import { foundResourceGuard } from '~/guards/found-resource.guard';
import { projectPermissionsGuard } from '~/guards/project-permissions-guard';

export enum AppRoutes {
  authCallback = 'auth-callback',
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
    loadComponent: () =>
      import('~/pages/login/login.page').then((x) => x.LoginPageComponent),
  },
  {
    path: AppRoutes.authCallback,
    loadComponent: () =>
      import('~/pages/auth-callback/auth-callback.page').then(
        (x) => x.AuthCallbackPageComponent,
      ),
  },
  {
    path: AppRoutes.changePassword,
    title: $localize`:Browser-tab-title@@page-title-change-password:Change password`,
    loadComponent: () =>
      import('~/pages/change-password/change-password.page').then(
        (x) => x.ChangePasswordPageComponent,
      ),
    canActivate: [
      authGuard,
      authCapabilitiesGuard(
        // only enable this if the authService has a ChangePasswordComponent
        (authService) => !!authService.ChangePasswordComponent,
      ),
    ],
  },
  {
    path: AppRoutes.projects,
    loadComponent: () =>
      import('~/pages/projects-overview/projects-overview.page').then(
        (x) => x.ProjectsOverviewPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.users,
    loadComponent: () =>
      import('~/pages/users/users.page').then((x) => x.UsersPageComponent),
    canActivate: [
      authGuard,
      authCapabilitiesGuard((authService) => authService.isOrganizationAdmin),
    ],
  },
  {
    path: AppRoutes.userRoles,
    loadComponent: () =>
      import('~/pages/user-roles/user-roles.page').then(
        (x) => x.UserRolesPageComponent,
      ),
    canActivate: [
      authGuard,
      authCapabilitiesGuard((authService) => authService.isOrganizationAdmin),
    ],
  },
  {
    path: `${AppRoutes.project}/:projectId`,
    canActivate: [authGuard, foundResourceGuard('project')],
    children: [
      {
        path: AppRoutes.projectMonitoring,
        loadComponent: () =>
          import('~/pages/project-monitoring/project-monitoring.page').then(
            (x) => x.ProjectMonitoringPageComponent,
          ),
        canActivate: [
          projectPermissionsGuard(PermissionEnum.ProgramMetricsREAD),
        ],
      },
      {
        path: AppRoutes.projectTeam,
        loadComponent: () =>
          import('~/pages/project-team/project-team.page').then(
            (x) => x.ProjectTeamPageComponent,
          ),
        canActivate: [
          projectPermissionsGuard(PermissionEnum.AidWorkerProgramREAD),
        ],
      },
      {
        path: AppRoutes.projectRegistrations,
        children: [
          {
            path: ``,
            loadComponent: () =>
              import(
                '~/pages/project-registrations/project-registrations.page'
              ).then((x) => x.ProjectRegistrationsPageComponent),
          },
          {
            path: `:registrationId`,
            canActivate: [foundResourceGuard('registration')],
            children: [
              {
                path: AppRoutes.projectRegistrationActivityLog,
                loadComponent: () =>
                  import(
                    '~/pages/project-registration-activity-log/project-registration-activity-log.page'
                  ).then((x) => x.ProjectRegistrationActivityLogPageComponent),
              },
              {
                path: AppRoutes.projectRegistrationPersonalInformation,
                loadComponent: () =>
                  import(
                    '~/pages/project-registration-personal-information/project-registration-personal-information.page'
                  ).then(
                    (x) =>
                      x.ProjectRegistrationPersonalInformationPageComponent,
                  ),
              },
              {
                path: AppRoutes.projectRegistrationDebitCards,
                loadComponent: () =>
                  import(
                    '~/pages/project-registration-debit-cards/project-registration-debit-cards.page'
                  ).then((x) => x.ProjectRegistrationDebitCardsPageComponent),
              },
              {
                path: ``,
                pathMatch: 'full',
                redirectTo: AppRoutes.projectRegistrationActivityLog,
              },
            ],
          },
        ],
      },
      {
        path: AppRoutes.projectPayments,
        children: [
          {
            path: ``,
            loadComponent: () =>
              import('~/pages/project-payments/project-payments.page').then(
                (x) => x.ProjectPaymentsPageComponent,
              ),
          },
          {
            path: `:paymentId`,
            pathMatch: 'full',
            canActivate: [foundResourceGuard('payment')],
            loadComponent: () =>
              import('~/pages/project-payment/project-payment.page').then(
                (x) => x.ProjectPaymentPageComponent,
              ),
          },
        ],
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
