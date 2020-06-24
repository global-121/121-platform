import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/shared/shared.module';

import { ReviewInclusionPage } from './review-inclusion.page';
import { ExportInclusionComponent } from 'src/app/program/export-inclusion/export-inclusion.component';

const routes: Routes = [
  {
    path: '',
    component: ReviewInclusionPage,
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
  declarations: [ReviewInclusionPage, ExportInclusionComponent],
})
export class ReviewInclusionPageModule {}
