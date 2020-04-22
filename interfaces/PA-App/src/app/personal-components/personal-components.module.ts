import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

import { ConversationService } from '../services/conversation.service';

import { CreateIdentityComponent } from './create-identity/create-identity.component';
import { EnrollInProgramComponent } from './enroll-in-program/enroll-in-program.component';
import { HandleProofComponent } from './handle-proof/handle-proof.component';
import { LoginIdentityComponent } from './login-identity/login-identity.component';
import { MeetingReminderComponent } from './meeting-reminder/meeting-reminder.component';
import { PreprintedQrcodeComponent } from './preprinted-qrcode/preprinted-qrcode.component';
import { SelectAppointmentComponent } from './select-appointment/select-appointment.component';
import { SelectCountryComponent } from './select-country/select-country.component';
import { SelectFspComponent } from './select-fsp/select-fsp.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { SetNotificationNumberComponent } from './set-notification-number/set-notification-number.component';
import { SignupSigninComponent } from './signup-signin/signup-signin.component';
import { StoreCredentialComponent } from './store-credential/store-credential.component';
import { InfoPopupComponent } from '../shared/info-popup/info-popup.component';

@NgModule({
  declarations: [
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    LoginIdentityComponent,
    MeetingReminderComponent,
    PreprintedQrcodeComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
    StoreCredentialComponent,
    InfoPopupComponent
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
    LoginIdentityComponent,
    MeetingReminderComponent,
    PreprintedQrcodeComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
    StoreCredentialComponent,
    InfoPopupComponent
  ],
  exports: [
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    LoginIdentityComponent,
    MeetingReminderComponent,
    PreprintedQrcodeComponent,
    SelectAppointmentComponent,
    SelectCountryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
    StoreCredentialComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [ConversationService]
})
export class PersonalComponentsModule { }

