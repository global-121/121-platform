import { Routes } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { authGuard } from '~/guards/auth.guard';
import { authCapabilitiesGuard } from '~/guards/auth-capabilities.guard';
import { foundResourceGuard } from '~/guards/found-resource.guard';
import { pendingChangesGuard } from '~/guards/pending-changes.guard';
import { projectPermissionsGuard } from '~/guards/project-permissions-guard';

export enum AppRoutes {
  authCallback = 'auth-callback',
  changePassword = 'change-password',
  login = 'login',
  privacy = 'privacy',
  project = 'project',
  projectMonitoring = 'monitoring',
  projectPayments = 'payments',
  projectRegistrationActivityLog = 'activity-log',
  projectRegistrationDebitCards = 'debit-cards',
  projectRegistrationPersonalInformation = 'personal-information',
  projectRegistrations = 'registrations',
  projects = 'projects',
  projectTeam = 'team',
  registrationLookup = 'registration-lookup',
  snake = 'snake',
  userRoles = 'user-roles',
  users = 'users',
}
export const routes: Routes = [
  {
    path: AppRoutes.login,
    title: $localize`:@@page-title-login:Log in`,
    loadComponent: () =>
      import('~/pages/login/login.page').then((x) => x.LoginPageComponent),
  },
  {
    path: AppRoutes.privacy,
    title: $localize`:@@page-title-privacy:Privacy`,
    loadComponent: () =>
      import('~/pages/privacy/privacy.page').then(
        (x) => x.PrivacyPageComponent,
      ),
  },
  {
    path: AppRoutes.authCallback,
    title: $localize`:@@generic-loading:Loading...`,
    loadComponent: () =>
      import('~/pages/auth-callback/auth-callback.page').then(
        (x) => x.AuthCallbackPageComponent,
      ),
  },
  {
    path: AppRoutes.snake,
    loadComponent: () =>
      import('~/pages/snake/snake.page').then((x) => x.SnakePageComponent),
  },
  {
    path: AppRoutes.changePassword,
    title: $localize`:@@page-title-change-password:Change password`,
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
    title: $localize`:@@page-title-all-projects:All projects`,
    loadComponent: () =>
      import('~/pages/projects-overview/projects-overview.page').then(
        (x) => x.ProjectsOverviewPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: AppRoutes.users,
    title: $localize`:@@page-title-users:Users`,
    loadComponent: () =>
      import('~/pages/users/users.page').then((x) => x.UsersPageComponent),
    canActivate: [
      authGuard,
      authCapabilitiesGuard((authService) => authService.isOrganizationAdmin),
    ],
  },
  {
    path: AppRoutes.userRoles,
    title: $localize`:@@page-title-user-roles:User roles`,
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
        title: $localize`:@@page-title-project-monitoring:Monitoring`,
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
        title: $localize`:@@page-title-project-team:Team`,
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
            title: $localize`:@@page-title-project-registrations:Registrations`,
            loadComponent: () =>
              import(
                '~/pages/project-registrations/project-registrations.page'
              ).then((x) => x.ProjectRegistrationsPageComponent),
          },
          {
            path: `:registrationId`,
            title: $localize`:@@page-title-project-registration-details:Registration details`,
            canActivate: [foundResourceGuard('registration')],
            children: [
              {
                path: AppRoutes.projectRegistrationActivityLog,
                title:
                  $localize`:@@page-title-project-registrations-activity-log:Activity log` +
                  ' | ' +
                  $localize`:@@page-title-project-registration-details:Registration details`,
                loadComponent: () =>
                  import(
                    '~/pages/project-registration-activity-log/project-registration-activity-log.page'
                  ).then((x) => x.ProjectRegistrationActivityLogPageComponent),
              },
              {
                path: AppRoutes.projectRegistrationPersonalInformation,
                title:
                  $localize`:@@page-title-project-registrations-personal-information:Personal information` +
                  ' | ' +
                  $localize`:@@page-title-project-registration-details:Registration details`,
                canDeactivate: [pendingChangesGuard],
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
                title:
                  $localize`:@@page-title-project-registrations-debit-cards:Debit cards` +
                  ' | ' +
                  $localize`:@@page-title-project-registration-details:Registration details`,
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
            title: $localize`:@@page-title-project-payments:Payments`,
            loadComponent: () =>
              import('~/pages/project-payments/project-payments.page').then(
                (x) => x.ProjectPaymentsPageComponent,
              ),
          },
          {
            path: `:paymentId`,
            title: $localize`:@@page-title-project-payment:Payment`,
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
    path: AppRoutes.registrationLookup,
    loadComponent: () =>
      import('~/pages/registration-lookup/registration-lookup.page').then(
        (x) => x.RegistrationLookupPageComponent,
      ),
    canActivate: [authGuard],
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
