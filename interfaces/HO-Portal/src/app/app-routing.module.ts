import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { UserRole } from './auth/user-role.enum';
import { ProgramPhase } from './models/program.model';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'user',
    loadChildren: () =>
      import('./user/user.module').then((m) => m.UserPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'help',
    loadChildren: () =>
      import('./help/help.module').then((m) => m.HelpPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'program/:id',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
        canActivate: [AuthGuard],
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then(
            (m) => m.DashboardPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'aid-workers',
        loadChildren: () =>
          import('./pages/aid-workers/aid-workers.module').then(
            (m) => m.AidWorkersPageModule,
          ),
        canActivate: [AuthGuard],
        data: {
          roles: [UserRole.RunProgram],
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
        path: ProgramPhase.reviewInclusion,
        loadChildren: () =>
          import('./pages/review-inclusion/review-inclusion.module').then(
            (m) => m.ReviewInclusionPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        // Fallback for change in url, from old to new syntax:
        path: 'registration-validation',
        pathMatch: 'full',
        redirectTo: ProgramPhase.registrationValidation,
      },
      {
        // Fallback for change in url, from old to new syntax:
        path: 'review-inclusion',
        pathMatch: 'full',
        redirectTo: ProgramPhase.reviewInclusion,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
