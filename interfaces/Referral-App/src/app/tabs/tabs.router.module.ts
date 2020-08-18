import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'referral',
        children: [
          {
            path: '',
            loadChildren: '../referral/referral.module#ReferralPageModule',
          },
        ],
      },
      {
        path: 'help',
        children: [
          {
            path: '',
            loadChildren: '../help/help.module#HelpPageModule',
          },
        ],
      },
      {
        path: '',
        redirectTo: '/tabs/referral',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/referral',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
