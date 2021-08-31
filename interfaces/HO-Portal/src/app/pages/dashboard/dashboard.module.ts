import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MetricsStatesOverTimeComponent } from 'src/app/program/metrics-states-over-time/metrics-states-over-time.component';
import { MetricsStatesComponent } from 'src/app/program/metrics-states/metrics-states.component';
import { MetricsTotalsComponent } from 'src/app/program/metrics-totals/metrics-totals.component';
import { MetricsComponent } from 'src/app/program/metrics/metrics.component';
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
  ],
  declarations: [
    DashboardPage,
    MetricsComponent,
    MetricsStatesComponent,
    MetricsStatesOverTimeComponent,
    MetricsTotalsComponent,
  ],
})
export class DashboardPageModule {}
