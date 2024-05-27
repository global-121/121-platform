import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AppRoutes } from './app-routes.enum';
import { AuthGuard } from './auth/auth.guard';
import { ProgramTab } from './models/program.model';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: AppRoutes.home,
  },
  {
    path: AppRoutes.login,
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: AppRoutes.auth,
    loadComponent: () =>
      import('./auth/entra-callback/entra-callback.component').then(
        (m) => m.EntraCallbackComponent,
      ),
    canActivate: [() => !!environment.use_sso_azure_entra],
  },
  {
    path: AppRoutes.user,
    loadChildren: () =>
      import('./pages/user/user.module').then((m) => m.UserPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: AppRoutes.home,
    loadChildren: () =>
      import('./pages/home/home.module').then((m) => m.HomePageModule),
    canActivate: [AuthGuard],
  },
  {
    path: AppRoutes.help,
    redirectTo: 'https://manual.121.global/',
  },
  {
    path: AppRoutes.users,
    loadChildren: () =>
      import('./pages/users/users.module').then((m) => m.UsersPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: AppRoutes.createProgram,
    loadChildren: () =>
      import('./pages/create-program/create-program.module').then(
        (m) => m.CreateProgramModule,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'program/:id',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: ProgramTab.peopleAffected,
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
        path: 'team',
        loadComponent: () =>
          import('./pages/team/team.page').then((m) => m.TeamPage),
        canActivate: [AuthGuard],
      },
      {
        path: ProgramTab.overview,
        loadChildren: () =>
          import('./pages/program-overview/program-overview.module').then(
            (m) => m.ProgramOverviewPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: ProgramTab.peopleAffected,
        loadChildren: () =>
          import('./pages/people-affected/people-affected.module').then(
            (m) => m.PeopleAffectedPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: ProgramTab.payment,
        loadChildren: () =>
          import('./pages/payment/payment.module').then(
            (m) => m.PaymentPageModule,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'registration/:paId',
        loadComponent: () =>
          import('./pages/registration-details/registration-details.page').then(
            (m) => m.RegistrationDetailsPage,
          ),
        canActivate: [AuthGuard],
      },
      {
        // Fallback for change in url, from old to new syntax:
        path: 'registrationValidation',
        pathMatch: 'full',
        redirectTo: ProgramTab.peopleAffected,
      },
      {
        // Fallback for change in url, from old to new syntax:
        path: 'inclusion',
        pathMatch: 'full',
        redirectTo: ProgramTab.peopleAffected,
      },
    ],
  },
  {
    path: AppRoutes.iframe,
    loadChildren: () =>
      import('./pages/iframe/iframe.module').then((m) => m.IframeModule),
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
