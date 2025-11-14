import { Routes } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { authGuard } from '~/guards/auth.guard';
import { authCapabilitiesGuard } from '~/guards/auth-capabilities.guard';
import { foundResourceGuard } from '~/guards/found-resource.guard';
import { pendingChangesGuard } from '~/guards/pending-changes.guard';
import { programPermissionsGuard } from '~/guards/program-permissions-guard';

export enum AppRoutes {
  authCallback = 'auth-callback',
  changePassword = 'change-password',
  login = 'login',
  privacy = 'privacy',
  program = 'program',
  programMonitoring = 'monitoring',
  programMonitoringDashboard = 'dashboard',
  programMonitoringFiles = 'files',
  programMonitoringPowerBI = 'powerbi',
  programPaymentLog = 'payment-log',
  programPayments = 'payments',
  programPaymentTransactionList = 'transaction-list',
  programRegistrationActivityLog = 'activity-log',
  programRegistrationDebitCards = 'debit-cards',
  programRegistrationPersonalInformation = 'personal-information',
  programRegistrations = 'registrations',
  programs = 'programs',
  programSettings = 'settings',
  programSettingsFsps = 'fsps',
  programSettingsInformation = 'information',
  programSettingsTeam = 'team',
  registrationByReferenceId = 'registration-by-reference-id',
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
    path: AppRoutes.programs,
    title: $localize`:@@page-title-all-programs:All programs`,
    loadComponent: () =>
      import('~/pages/programs-overview/programs-overview.page').then(
        (x) => x.ProgramsOverviewPageComponent,
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
    path: `${AppRoutes.program}/:programId`,
    canActivate: [authGuard, foundResourceGuard('program')],
    children: [
      {
        path: AppRoutes.programMonitoring,
        children: [
          {
            path: AppRoutes.programMonitoringPowerBI,
            title:
              $localize`:@@page-title-program-monitoring-powerbi:PowerBI` +
              ' | ' +
              $localize`:@@page-title-program-monitoring:Monitoring`,
            loadComponent: () =>
              import(
                '~/pages/program-monitoring-powerbi/program-monitoring-powerbi.page'
              ).then((x) => x.ProgramMonitoringPowerbiPageComponent),
          },
          {
            path: AppRoutes.programMonitoringDashboard,
            title:
              $localize`:@@page-title-program-monitoring-dashboard:Dashboard` +
              ' | ' +
              $localize`:@@page-title-program-monitoring:Monitoring`,
            loadComponent: () =>
              import(
                '~/pages/program-monitoring-dashboard/program-monitoring-dashboard.page'
              ).then((x) => x.ProgramMonitoringDashboardPageComponent),
          },
          {
            path: AppRoutes.programMonitoringFiles,
            title:
              $localize`:@@page-title-program-monitoring-files:Files` +
              ' | ' +
              $localize`:@@page-title-program-monitoring:Monitoring`,
            loadComponent: () =>
              import(
                '~/pages/program-monitoring-files/program-monitoring-files.page'
              ).then((x) => x.ProgramMonitoringFilesPageComponent),
            canActivate: [
              programPermissionsGuard({
                permission: PermissionEnum.ProgramAttachmentsREAD,
              }),
            ],
          },
          {
            path: ``,
            pathMatch: 'full',
            redirectTo: AppRoutes.programMonitoringPowerBI,
          },
        ],
      },
      {
        path: AppRoutes.programSettings,
        title: $localize`:@@page-title-program-settings:Settings`,
        children: [
          {
            path: AppRoutes.programSettingsInformation,
            title:
              $localize`Program information` +
              ' | ' +
              $localize`:@@page-title-program-settings:Settings`,
            loadComponent: () =>
              import(
                '~/pages/program-settings-information/program-settings-information.page'
              ).then((x) => x.ProgramSettingsInformationPageComponent),
            canActivate: [
              programPermissionsGuard({
                permission: PermissionEnum.ProgramUPDATE,
                fallbackRoute: [
                  AppRoutes.programSettings,
                  AppRoutes.programSettingsTeam,
                ],
              }),
            ],
          },
          {
            path: AppRoutes.programSettingsFsps,
            title:
              $localize`:@@page-title-program-settings-fsps:FSPs` +
              ' | ' +
              $localize`:@@page-title-program-program-settings:Program settings`,
            loadComponent: () =>
              import(
                '~/pages/program-settings-fsps/program-settings-fsps.page'
              ).then((x) => x.ProgramSettingsFspsPageComponent),
            canActivate: [
              authCapabilitiesGuard((authService) => authService.isAdmin),
            ],
          },
          {
            path: AppRoutes.programSettingsTeam,
            title:
              $localize`:@@page-title-program-settings-team:Program team` +
              ' | ' +
              $localize`:@@page-title-program-settings:Settings`,
            loadComponent: () =>
              import(
                '~/pages/program-settings-team/program-settings-team.page'
              ).then((x) => x.ProgramSettingsTeamPageComponent),
            canActivate: [
              programPermissionsGuard({
                permission: PermissionEnum.AidWorkerProgramREAD,
              }),
            ],
          },
          {
            path: ``,
            pathMatch: 'full',
            redirectTo: AppRoutes.programSettingsInformation,
          },
        ],
      },
      {
        path: AppRoutes.programRegistrations,
        children: [
          {
            path: ``,
            title: $localize`:@@page-title-program-registrations:Registrations`,
            loadComponent: () =>
              import(
                '~/pages/program-registrations/program-registrations.page'
              ).then((x) => x.ProgramRegistrationsPageComponent),
          },
          {
            path: `:registrationId`,
            title: $localize`:@@page-title-program-registration-details:Registration details`,
            canActivate: [foundResourceGuard('registration')],
            children: [
              {
                path: AppRoutes.programRegistrationActivityLog,
                title:
                  $localize`:@@page-title-program-registrations-activity-log:Activity log` +
                  ' | ' +
                  $localize`:@@page-title-program-registration-details:Registration details`,
                loadComponent: () =>
                  import(
                    '~/pages/program-registration-activity-log/program-registration-activity-log.page'
                  ).then((x) => x.ProgramRegistrationActivityLogPageComponent),
              },
              {
                path: AppRoutes.programRegistrationPersonalInformation,
                title:
                  $localize`:@@page-title-program-registrations-personal-information:Personal information` +
                  ' | ' +
                  $localize`:@@page-title-program-registration-details:Registration details`,
                canDeactivate: [pendingChangesGuard],
                loadComponent: () =>
                  import(
                    '~/pages/program-registration-personal-information/program-registration-personal-information.page'
                  ).then(
                    (x) =>
                      x.ProgramRegistrationPersonalInformationPageComponent,
                  ),
              },
              {
                path: AppRoutes.programRegistrationDebitCards,
                title:
                  $localize`:@@page-title-program-registrations-debit-cards:Debit cards` +
                  ' | ' +
                  $localize`:@@page-title-program-registration-details:Registration details`,
                loadComponent: () =>
                  import(
                    '~/pages/program-registration-debit-cards/program-registration-debit-cards.page'
                  ).then((x) => x.ProgramRegistrationDebitCardsPageComponent),
              },
              {
                path: ``,
                pathMatch: 'full',
                redirectTo: AppRoutes.programRegistrationActivityLog,
              },
            ],
          },
        ],
      },
      {
        path: AppRoutes.programPayments,
        children: [
          {
            path: ``,
            title: $localize`:@@page-title-program-payments:Payments`,
            loadComponent: () =>
              import('~/pages/program-payments/program-payments.page').then(
                (x) => x.ProgramPaymentsPageComponent,
              ),
          },
          {
            path: `:paymentId`,
            canActivate: [foundResourceGuard('payment')],
            children: [
              {
                path: AppRoutes.programPaymentTransactionList,
                title: $localize`:@@page-title-program-transaction-list:Transaction list`,
                loadComponent: () =>
                  import(
                    '~/pages/program-payment-transaction-list/program-payment-transaction-list.page'
                  ).then((x) => x.ProgramPaymentTransactionListPageComponent),
              },
              {
                path: AppRoutes.programPaymentLog,
                title: $localize`:@@page-title-program-payment-log:Payment log`,
                loadComponent: () =>
                  import(
                    '~/pages/program-payment-log/program-payment-log.page'
                  ).then((x) => x.ProgramPaymentLogPageComponent),
              },
              {
                path: ``,
                pathMatch: 'full',
                redirectTo: AppRoutes.programPaymentTransactionList,
              },
            ],
          },
        ],
      },
      {
        path: `${AppRoutes.registrationByReferenceId}/:referenceId`,
        loadComponent: () =>
          import(
            '~/pages/registration-by-reference-id/registration-by-reference-id.page'
          ).then((x) => x.RegistrationByReferenceIdPageComponent),
        canActivate: [authGuard],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: AppRoutes.programRegistrations,
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
    path: AppRoutes.program,
    redirectTo: AppRoutes.programs,
    pathMatch: 'full',
  },
  { path: '', redirectTo: AppRoutes.programs, pathMatch: 'full' },
  {
    path: '**',
    redirectTo: AppRoutes.programs,
  },
];
