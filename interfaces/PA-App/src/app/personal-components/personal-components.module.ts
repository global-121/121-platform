import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { ConversationService } from '../services/conversation.service';

import { ChooseCredentialTypeComponent } from './choose-credential-type/choose-credential-type.component';
import { CreatePasswordComponent } from './create-password/create-password.component';
import { GetProgramDetailsComponent } from './get-program-details/get-program-details.component';
import { IdentityFormComponent } from './identity-form/identity-form.component';
import { InitialNeedsComponent } from './initial-needs/initial-needs.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';
import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { SelectProgramComponent } from './select-program/select-program.component';

@NgModule({
  declarations: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    GetProgramDetailsComponent,
    IdentityFormComponent,
    InitialNeedsComponent,
    IntroductionComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  entryComponents: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    GetProgramDetailsComponent,
    IdentityFormComponent,
    InitialNeedsComponent,
    IntroductionComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
  ],
  exports: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    GetProgramDetailsComponent,
    IdentityFormComponent,
    InitialNeedsComponent,
    IntroductionComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

