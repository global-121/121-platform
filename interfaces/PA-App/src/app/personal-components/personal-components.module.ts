import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InfoPopupComponent } from '../shared/info-popup/info-popup.component';
import { SharedModule } from '../shared/shared.module';
import { AutoSignupComponent } from './auto-signup/auto-signup.component';
import { ConsentQuestionComponent } from './consent-question/consent-question.component';
import { ContactDetailsComponent } from './contact-details/contact-details.component';
import { CreateAccountComponent } from './create-account/create-account.component';
import { EnrollInProgramComponent } from './enroll-in-program/enroll-in-program.component';
import { LoginAccountComponent } from './login-account/login-account.component';
import { MonitoringQuestionComponent } from './monitoring-question/monitoring-question.component';
import { NextPaComponent } from './next-pa/next-pa.component';
import { RegistrationSummaryComponent } from './registration-summary/registration-summary.component';
import { SelectFspComponent } from './select-fsp/select-fsp.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { SetNotificationNumberComponent } from './set-notification-number/set-notification-number.component';
import { SignupSigninComponent } from './signup-signin/signup-signin.component';

@NgModule({
  declarations: [
    ConsentQuestionComponent,
    ContactDetailsComponent,
    CreateAccountComponent,
    EnrollInProgramComponent,
    LoginAccountComponent,
    MonitoringQuestionComponent,
    RegistrationSummaryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
    InfoPopupComponent,
    AutoSignupComponent,
    NextPaComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule],
  exports: [
    ConsentQuestionComponent,
    ContactDetailsComponent,
    CreateAccountComponent,
    EnrollInProgramComponent,
    LoginAccountComponent,
    MonitoringQuestionComponent,
    RegistrationSummaryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
    AutoSignupComponent,
    NextPaComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
})
export class PersonalComponentsModule {}
