import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { ConversationService } from '../services/conversation.service';
import { InfoPopupComponent } from '../shared/info-popup/info-popup.component';
import { QrScannerComponent } from '../shared/qr-scanner/qr-scanner.component';
import { SharedModule } from '../shared/shared.module';
import { ConsentQuestionComponent } from './consent-question/consent-question.component';
import { ContactDetailsComponent } from './contact-details/contact-details.component';
import { CreateIdentityComponent } from './create-identity/create-identity.component';
import { EnrollInProgramComponent } from './enroll-in-program/enroll-in-program.component';
import { HandleProofComponent } from './handle-proof/handle-proof.component';
import { LoginIdentityComponent } from './login-identity/login-identity.component';
import { MonitoringQuestionComponent } from './monitoring-question/monitoring-question.component';
import { PreprintedQrcodeComponent } from './preprinted-qrcode/preprinted-qrcode.component';
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
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    LoginIdentityComponent,
    MonitoringQuestionComponent,
    PreprintedQrcodeComponent,
    RegistrationSummaryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
    InfoPopupComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule, QRCodeModule],
  entryComponents: [
    ConsentQuestionComponent,
    ContactDetailsComponent,
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    LoginIdentityComponent,
    MonitoringQuestionComponent,
    PreprintedQrcodeComponent,
    RegistrationSummaryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
    InfoPopupComponent,
    QrScannerComponent,
  ],
  exports: [
    ConsentQuestionComponent,
    ContactDetailsComponent,
    CreateIdentityComponent,
    EnrollInProgramComponent,
    HandleProofComponent,
    LoginIdentityComponent,
    MonitoringQuestionComponent,
    PreprintedQrcodeComponent,
    RegistrationSummaryComponent,
    SelectFspComponent,
    SelectLanguageComponent,
    SelectProgramComponent,
    SetNotificationNumberComponent,
    SignupSigninComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ConversationService],
})
export class PersonalComponentsModule {}
