import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: ':region',
    component: TabsPage,
    loadChildren: '../referral/referral.module#ReferralPageModule',
  },
  {
    path: '',
    component: TabsPage,
    loadChildren: '../referral/referral.module#ReferralPageModule',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
