import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { ConversationService } from '../services/conversation.service';

import { ChooseCredentialTypeComponent } from './choose-credential-type/choose-credential-type.component';
import { CreatePasswordComponent } from './create-password/create-password.component';
import { GetInfoComponent } from './get-info/get-info.component';
import { GetProgramDetailsComponent } from './get-program-details/get-program-details.component';
import { IdentityFormComponent } from './identity-form/identity-form.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';
import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { TellNeedsComponent } from './tell-needs/tell-needs.component';

@NgModule({
  declarations: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    GetInfoComponent,
    GetProgramDetailsComponent,
    IdentityFormComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    TellNeedsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  entryComponents: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    GetInfoComponent,
    GetProgramDetailsComponent,
    IdentityFormComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    TellNeedsComponent,
  ],
  exports: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    GetInfoComponent,
    GetProgramDetailsComponent,
    IdentityFormComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    TellNeedsComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

