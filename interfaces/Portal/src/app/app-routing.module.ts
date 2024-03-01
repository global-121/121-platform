import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { environment } from '../environments/environment';
import { AppRoutes } from './app-routes.enum';
import { AuthGuard } from './auth/auth.guard';
import { ProgramPhase } from './models/program.model';

const sso =
  environment.azure_ad_client_id &&
  environment.azure_ad_client_id !== '' &&
  environment.azure_ad_tenant_id &&
  environment.azure_ad_tenant_id !== '';

const routes: Routes = [
  // {
  //   path: '',
  //   pathMatch: 'full',
  //   redirectTo: AppRoutes.home,
  // },
  {
    path: AppRoutes.login,
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: AppRoutes.user,
    loadChildren: () =>
      import('./user/user.module').then((m) => m.UserPageModule),
    canActivate: [sso ? MsalGuard : AuthGuard],
  },
  {
    path: AppRoutes.home,
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
    canActivate: [sso ? MsalGuard : AuthGuard],
  },
  {
    path: AppRoutes.help,
    loadChildren: () =>
      import('./help/help.module').then((m) => m.HelpPageModule),
    canActivate: [sso ? MsalGuard : AuthGuard],
  },
  {
    path: AppRoutes.users,
    loadChildren: () =>
      import('./users/users.module').then((m) => m.UsersPageModule),
    canActivate: [sso ? MsalGuard : AuthGuard],
  },
  {
    path: 'program/:id',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then(
            (m) => m.DashboardPageModule,
          ),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./pages/team/team.page').then((m) => m.TeamPage),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        path: ProgramPhase.design,
        loadChildren: () =>
          import('./pages/design/design.module').then(
            (m) => m.DesignPageModule,
          ),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        path: ProgramPhase.registrationValidation,
        loadChildren: () =>
          import(
            './pages/registration-validation/registration-validation.module'
          ).then((m) => m.RegistrationValidationPageModule),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        path: ProgramPhase.inclusion,
        loadChildren: () =>
          import('./pages/inclusion/inclusion.module').then(
            (m) => m.InclusionPageModule,
          ),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        path: ProgramPhase.payment,
        loadChildren: () =>
          import('./pages/payment/payment.module').then(
            (m) => m.PaymentPageModule,
          ),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        path: ProgramPhase.evaluation,
        loadChildren: () =>
          import('./pages/evaluation/evaluation.module').then(
            (m) => m.EvaluationPageModule,
          ),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        path: 'registration/:paId',
        loadComponent: () =>
          import('./pages/registration-details/registration-details.page').then(
            (m) => m.RegistrationDetailsPage,
          ),
        canActivate: [sso ? MsalGuard : AuthGuard],
      },
      {
        // Fallback for change in url, from old to new syntax:
        path: 'registration-validation',
        pathMatch: 'full',
        redirectTo: ProgramPhase.registrationValidation,
      },
    ],
  },
  {
    path: AppRoutes.iframe,
    loadChildren: () =>
      import('./iframe/iframe.module').then((m) => m.IframeModule),
    canActivate: [sso ? MsalGuard : AuthGuard],
  },
  {
    path: '**',
    redirectTo: AppRoutes.home,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
