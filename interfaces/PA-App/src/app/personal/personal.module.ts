import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicStorageModule } from '@ionic/storage';

import { SharedModule } from '../shared/shared.module';
import { PersonalComponentsModule } from '../personal-components/personal-components.module';

import { PersonalPage } from './personal.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: PersonalPage }]),
    IonicStorageModule.forRoot(),
    SharedModule,
    PersonalComponentsModule,
  ],
  declarations: [PersonalPage],
})
export class PersonalPageModule {}
