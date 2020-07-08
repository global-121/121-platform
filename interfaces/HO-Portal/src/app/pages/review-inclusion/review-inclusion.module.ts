import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ExportListComponent } from 'src/app/program/export-list/export-list.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReviewInclusionPage } from './review-inclusion.page';

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
  declarations: [ReviewInclusionPage, ExportListComponent],
})
export class ReviewInclusionPageModule {}
