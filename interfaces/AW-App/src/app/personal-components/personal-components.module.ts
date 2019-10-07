import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { ConversationService } from '../services/conversation.service';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { ViewAppointmentsComponent } from './view-appointments/view-appointments.component';
import { ScanQrComponent } from './scan-qr/scan-qr.component';
import { ValidateProgramComponent } from './validate-program/validate-program.component';

@NgModule({
  declarations: [
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    ValidateProgramComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  entryComponents: [
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    ValidateProgramComponent
  ],
  exports: [
    MainMenuComponent,
    ViewAppointmentsComponent,
    ScanQrComponent,
    ValidateProgramComponent
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

