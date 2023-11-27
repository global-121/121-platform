import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DashboardIframeComponent } from 'src/app/components/dashboard-iframe/dashboard-iframe.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EvaluationPage } from './evaluation.page';

const routes: Routes = [
  {
    path: '',
    component: EvaluationPage,
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
  declarations: [EvaluationPage],
})
export class EvaluationPageModule {}
