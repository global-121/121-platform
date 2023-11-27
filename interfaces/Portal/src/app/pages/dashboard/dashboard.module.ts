import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DashboardIframeComponent } from 'src/app/components/dashboard-iframe/dashboard-iframe.component';
import { MetricsStatesComponent } from 'src/app/program/metrics-states/metrics-states.component';
import { MetricsTotalsComponent } from 'src/app/program/metrics-totals/metrics-totals.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardPage } from './dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes),
    DashboardIframeComponent,
  ],
  declarations: [DashboardPage, MetricsStatesComponent, MetricsTotalsComponent],
})
export class DashboardPageModule {}
