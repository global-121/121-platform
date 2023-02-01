import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { MetricsComponent } from '../../program/metrics/metrics.component';
import { DesignPage } from './design.page';

const routes: Routes = [
  {
    path: '',
    component: DesignPage,
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
  declarations: [DesignPage, MetricsComponent],
})
export class DesignPageModule {}
