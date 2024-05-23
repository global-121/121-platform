import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { MetricsComponent } from '../../program/metrics/metrics.component';
import { ProgramOverviewPage } from './program-overview.page';

const routes: Routes = [
  {
    path: '',
    component: ProgramOverviewPage,
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
  declarations: [ProgramOverviewPage, MetricsComponent],
})
export class ProgramOverviewPageModule {}
