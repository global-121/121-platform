import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AppRoutes } from './app-routes.enum';
import { AuthGuard } from './auth/auth.guard';
import Permission from './auth/permission.enum';
import { ProgramPhase } from './models/program.model';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: AppRoutes.home,
  },
  {
    path: AppRoutes.login,
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: AppRoutes.user,
    loadChildren: () =>
      import('./user/user.module').then((m) => m.UserPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: AppRoutes.home,
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
    canActivate: [AuthGuard],
  },
  {
    path: AppRoutes.help,
    loadChildren: () =>
      import('./help/help.module').then((m) => m.HelpPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: AppRoutes.users,
    loadChildren: () =>
      import('./users/users.module').then((m) => m.UsersPageModule),
    canActivate: [AuthGuard],
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
        canActivate: [AuthGuard],
        data: {
          permissions: [Permission.ProgramMetricsREAD],
        },
      },
      {
        path: 'aid-workers',
        loadChildren: () =>
          import('./pages/aid-workers/aid-workers.module').then(
            (m) => m.AidWorkersPageModule,
          ),
        canActivate: [AuthGuard],
        data: {
          permissions: [Permission.AidWorkerProgramUPDATE],
        },
      },
      {
        path: ProgramPhase.design,
        loadChildren: () =>
          import('./pages/design/design.module').then(
            (m) => m.DesignPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: ProgramPhase.registrationValidation,
        loadChildren: () =>
          import(
            './pages/registration-validation/registration-validation.module'
          ).then((m) => m.RegistrationValidationPageModule),
        canActivate: [AuthGuard],
      },
      {
        path: ProgramPhase.inclusion,
        loadChildren: () =>
          import('./pages/inclusion/inclusion.module').then(
            (m) => m.InclusionPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: ProgramPhase.payment,
        loadChildren: () =>
          import('./pages/payment/payment.module').then(
            (m) => m.PaymentPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: ProgramPhase.evaluation,
        loadChildren: () =>
          import('./pages/evaluation/evaluation.module').then(
            (m) => m.EvaluationPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'registration/:paId',
        loadComponent: () =>
          import('./pages/registration-details/registration-details.page').then(
            (m) => m.RegistrationDetailsPage,
          ),
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
    canActivate: [AuthGuard],
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
