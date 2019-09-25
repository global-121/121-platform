import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { ConversationService } from '../services/conversation.service';
import { LoginComponent } from './login/login.component';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { ViewAppointmentsComponent } from './view-appointments/view-appointments.component';
import { ScanQrComponent } from './scan-qr/scan-qr.component';
import { ValidateIdentityComponent } from './validate-identity/validate-identity.component';
import { ValidateProgramComponent } from './validate-program/validate-program.component';

@NgModule({
  declarations: [
    LoginComponent,
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    ValidateIdentityComponent,
    ValidateProgramComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  entryComponents: [
    LoginComponent,
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    ValidateIdentityComponent,
    ValidateProgramComponent
  ],
  exports: [
    LoginComponent,
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    ValidateIdentityComponent,
    ValidateProgramComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

