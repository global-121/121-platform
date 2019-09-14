import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

import { ConversationService } from '../services/conversation.service';

import { ChooseCredentialTypeComponent } from './choose-credential-type/choose-credential-type.component';
import { CreatePasswordComponent } from './create-password/create-password.component';
import { EnrollInProgramComponent } from './enroll-in-program/enroll-in-program.component';
import { IdentityFormComponent } from './identity-form/identity-form.component';
import { InitialNeedsComponent } from './initial-needs/initial-needs.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';
import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { StoreCredentialComponent } from './store-credential/store-credential.component';

@NgModule({
  declarations: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    EnrollInProgramComponent,
    IdentityFormComponent,
    InitialNeedsComponent,
    IntroductionComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    StoreCredentialComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    QRCodeModule
  ],
  entryComponents: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    EnrollInProgramComponent,
    IdentityFormComponent,
    InitialNeedsComponent,
    IntroductionComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    StoreCredentialComponent,
  ],
  exports: [
    ChooseCredentialTypeComponent,
    CreatePasswordComponent,
    EnrollInProgramComponent,
    IdentityFormComponent,
    InitialNeedsComponent,
    IntroductionComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    StoreCredentialComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

