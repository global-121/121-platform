import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'account',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../account/account.module').then(
                (m) => m.AccountPageModule,
              ),
          },
        ],
      },
      {
        path: 'validation',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../validation/validation.module').then(
                (m) => m.ValidationPageModule,
              ),
            canActivate: [AuthGuard],
          },
        ],
      },
      {
        path: 'tab3',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../tab3/tab3.module').then((m) => m.Tab3PageModule),
            canActivate: [AuthGuard],
          },
        ],
      },
      {
        path: '',
        redirectTo: '/tabs/account',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/account',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
