import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { ConversationService } from '../services/conversation.service';
import { LoginComponent } from './login/login.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { ViewAppointmentsComponent } from './view-appointments/view-appointments.component';


const personalComponents = [
  LoginComponent,
  MainMenuComponent,
  ViewAppointmentsComponent
];

@NgModule({
  declarations: [].concat(personalComponents),
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  entryComponents: [].concat(personalComponents),
  exports: [].concat(personalComponents),
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

