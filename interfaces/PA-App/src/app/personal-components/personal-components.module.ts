import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InfoPopupComponent } from '../shared/info-popup/info-popup.component';
import { SharedModule } from '../shared/shared.module';
import { AutoSignupComponent } from './auto-signup/auto-signup.component';
import { ConsentQuestionComponent } from './consent-question/consent-question.component';
import { ContactDetailsComponent } from './contact-details/contact-details.component';
import { EnrollInProgramComponent } from './enroll-in-program/enroll-in-program.component';
import { MonitoringQuestionComponent } from './monitoring-question/monitoring-question.component';
import { NextPaComponent } from './next-pa/next-pa.component';
import { RegistrationSummaryComponent } from './registration-summary/registration-summary.component';
import { SelectFspComponent } from './select-fsp/select-fsp.component';
import { SelectLanguageComponent } from './select-language/select-language.component';
import { SelectProgramComponent } from './select-program/select-program.component';
import { SetNotificationNumberComponent } from './set-notification-number/set-notification-number.component';

@NgModule({
  declarations: [
    ConsentQuestionComponent,
    ContactDetailsComponent,
    EnrollInProgramComponent,
    MonitoringQuestionComponent,
    RegistrationSummaryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    InfoPopupComponent,
    AutoSignupComponent,
    NextPaComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule],
  exports: [
    ConsentQuestionComponent,
    ContactDetailsComponent,
    EnrollInProgramComponent,
    MonitoringQuestionComponent,
    RegistrationSummaryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    AutoSignupComponent,
    NextPaComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
})
export class PersonalComponentsModule {}
