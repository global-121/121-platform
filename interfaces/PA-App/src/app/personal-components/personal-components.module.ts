import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

import { ConversationService } from '../services/conversation.service';

import { CreateIdentityComponent } from './create-identity/create-identity.component';
import { EnrollInProgramComponent } from './enroll-in-program/enroll-in-program.component';
import { InitialNeedsComponent } from './initial-needs/initial-needs.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';
import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { StoreCredentialComponent } from './store-credential/store-credential.component';
import { HandleProofComponent } from './handle-proof/handle-proof.component';
import { SignupSigninComponent } from './signup-signin/signup-signin.component';
import { LoginIdentityComponent } from './login-identity/login-identity.component';

@NgModule({
  declarations: [
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    InitialNeedsComponent,
    LoginIdentityComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SignupSigninComponent,
    StoreCredentialComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    QRCodeModule
  ],
  entryComponents: [
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    InitialNeedsComponent,
    LoginIdentityComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SignupSigninComponent,
    StoreCredentialComponent,
  ],
  exports: [
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    InitialNeedsComponent,
    LoginIdentityComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SignupSigninComponent,
    StoreCredentialComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

