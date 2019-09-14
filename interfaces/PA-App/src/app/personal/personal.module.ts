import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonalPage } from './personal.page';
import { SharedModule } from '../shared/shared.module';
import { PersonalComponentsModule } from '../personal-components/personal-components.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: PersonalPage }]),
    SharedModule,
    PersonalComponentsModule,
  ],
  declarations: [PersonalPage]
})
export class PersonalPageModule { }
