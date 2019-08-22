import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { ConversationService } from '../services/conversation.service';

import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { GetProgramDetailsComponent } from './get-program-details/get-program-details.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';

@NgModule({
  declarations: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  entryComponents: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
  ],
  exports: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

