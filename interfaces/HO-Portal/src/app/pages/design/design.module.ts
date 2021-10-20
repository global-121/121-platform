import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ProgramDetailsComponent } from 'src/app/program/program-details/program-details.component';
import { ProgramJsonComponent } from 'src/app/program/program-json/program-json.component';
import { SharedModule } from 'src/app/shared/shared.module';
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
  declarations: [DesignPage, ProgramDetailsComponent, ProgramJsonComponent],
})
export class DesignPageModule {}
