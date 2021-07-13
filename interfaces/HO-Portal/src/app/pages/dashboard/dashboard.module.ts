import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MetricsStatesComponent } from 'src/app/program/metrics-states/metrics-states.component';
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
  declarations: [DashboardPage, MetricsComponent, MetricsStatesComponent],
})
export class DashboardPageModule {}
