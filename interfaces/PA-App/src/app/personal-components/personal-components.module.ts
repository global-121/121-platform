import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { ConversationService } from '../services/conversation.service';

import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { GetProgramDetailsComponent } from './get-program-details/get-program-details.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { GetInfoComponent } from './get-info/get-info.component';
import { TellNeedsComponent } from './tell-needs/tell-needs.component';

@NgModule({
  declarations: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
    SelectLanguageComponent,
    GetInfoComponent,
    TellNeedsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  entryComponents: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
    SelectLanguageComponent,
    GetInfoComponent,
    TellNeedsComponent,
  ],
  exports: [
    SelectCountryComponent,
    SelectProgramComponent,
    GetProgramDetailsComponent,
    SelectAppointmentComponent,
    SelectLanguageComponent,
    GetInfoComponent,
    TellNeedsComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

