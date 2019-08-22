import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { ConversationService } from '../services/conversation.service';

import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { GetProgramDetailsComponent } from './get-program-details/get-program-details.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';
import { SelectLanguageComponent } from './select-language/select-language.component';

@NgModule({
  declarations: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
    SelectLanguageComponent,
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
    SelectLanguageComponent,
  ],
  exports: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
    SelectLanguageComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

