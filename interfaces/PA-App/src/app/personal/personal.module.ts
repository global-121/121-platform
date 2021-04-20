import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PersonalComponentsModule } from '../personal-components/personal-components.module';
import { SharedModule } from '../shared/shared.module';
import { PersonalPage } from './personal.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: PersonalPage }]),
    SharedModule,
    PersonalComponentsModule,
  ],
  declarations: [PersonalPage],
})
export class PersonalPageModule {}
