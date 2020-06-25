import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { UserRole } from './auth/user-role.enum';
import { ProgramPhase } from './models/program.model';
import { camelCase2Kebab } from './shared/camelcase-to-kebabcase';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: './login/login.module#LoginPageModule',
  },
  {
    path: 'home',
    loadChildren: './home/home.module#HomePageModule',
    canActivate: [AuthGuard],
  },
  {
    path: 'help',
    loadChildren: './help/help.module#HelpPageModule',
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
        loadChildren: './pages/dashboard/dashboard.module#DashboardPageModule',
        canActivate: [AuthGuard],
      },
      {
        path: 'aid-workers',
        loadChildren:
          './pages/aid-workers/aid-workers.module#AidWorkersPageModule',
        canActivate: [AuthGuard],
        data: {
          roles: [UserRole.ProjectOfficer],
        },
      },
      {
        path: camelCase2Kebab(ProgramPhase.design),
        loadChildren: './pages/design/design.module#DesignPageModule',
        canActivate: [AuthGuard],
      },
      {
        path: camelCase2Kebab(ProgramPhase.registrationValidation),
        loadChildren:
          './pages/registration-validation/registration-validation.module#RegistrationValidationPageModule',
        canActivate: [AuthGuard],
      },
      {
        path: camelCase2Kebab(ProgramPhase.inclusion),
        loadChildren: './pages/inclusion/inclusion.module#InclusionPageModule',
        canActivate: [AuthGuard],
      },
      {
        path: camelCase2Kebab(ProgramPhase.payment),
        loadChildren: './pages/payment/payment.module#PaymentPageModule',
        canActivate: [AuthGuard],
      },
      {
        path: camelCase2Kebab(ProgramPhase.evaluation),
        loadChildren:
          './pages/evaluation/evaluation.module#EvaluationPageModule',
        canActivate: [AuthGuard],
      },
      {
        path: camelCase2Kebab(ProgramPhase.reviewInclusion),
        loadChildren:
          './pages/review-inclusion/review-inclusion.module#ReviewInclusionPageModule',
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
