import { Component, ViewChild, OnInit, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService, ConversationSection } from '../services/conversation.service';
import { PersonalComponent } from '../personal-components/personal-component.class';

import { PersonalComponents } from '../personal-components/personal-components.enum';

import { CreateIdentityComponent } from '../personal-components/create-identity/create-identity.component';
import { EnrollInProgramComponent } from '../personal-components/enroll-in-program/enroll-in-program.component';
import { HandleProofComponent } from './../personal-components/handle-proof/handle-proof.component';
import { LoginIdentityComponent } from '../personal-components/login-identity/login-identity.component';
import { MeetingReminderComponent } from '../personal-components/meeting-reminder/meeting-reminder.component';
import { SelectAppointmentComponent } from '../personal-components/select-appointment/select-appointment.component';
import { SelectCountryComponent } from '../personal-components/select-country/select-country.component';
import { SelectFspComponent } from '../personal-components/select-fsp/select-fsp.component';
import { SelectLanguageComponent } from '../personal-components/select-language/select-language.component';
import { SelectProgramComponent } from '../personal-components/select-program/select-program.component';
import { SetNotificationNumberComponent } from '../personal-components/set-notification-number/set-notification-number.component';
import { SignupSigninComponent } from '../personal-components/signup-signin/signup-signin.component';
import { StoreCredentialComponent } from '../personal-components/store-credential/store-credential.component';
import { TranslateService } from '@ngx-translate/core';
import { PreprintedQrcodeComponent } from '../personal-components/preprinted-qrcode/preprinted-qrcode.component';

@Component({
  selector: 'app-personal',
  templateUrl: 'personal.page.html',
  styleUrls: ['personal.page.scss'],
})
export class PersonalPage implements OnInit {
  @ViewChild(IonContent)
  public ionContent: IonContent;

  @ViewChild('conversationContainer', { read: ViewContainerRef })
  public container;

  public isDebug: boolean = environment.isDebug;
  public showDebug: boolean = environment.showDebug;

  private scrollSpeed = environment.useAnimation ? 600 : 0;

  public availableSections = {
    [PersonalComponents.createIdentity]: CreateIdentityComponent,
    [PersonalComponents.enrollInProgram]: EnrollInProgramComponent,
    [PersonalComponents.handleProof]: HandleProofComponent,
    [PersonalComponents.loginIdentity]: LoginIdentityComponent,
    [PersonalComponents.meetingReminder]: MeetingReminderComponent,
    [PersonalComponents.preprintedQrcode]: PreprintedQrcodeComponent,
    [PersonalComponents.selectAppointment]: SelectAppointmentComponent,
    [PersonalComponents.selectCountry]: SelectCountryComponent,
    [PersonalComponents.selectFsp]: SelectFspComponent,
    [PersonalComponents.selectLanguage]: SelectLanguageComponent,
    [PersonalComponents.selectProgram]: SelectProgramComponent,
    [PersonalComponents.setNotificationNumber]: SetNotificationNumberComponent,
    [PersonalComponents.signupSignin]: SignupSigninComponent,
    [PersonalComponents.storeCredential]: StoreCredentialComponent,
  };
  public debugSections = Object.keys(this.availableSections);

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private resolver: ComponentFactoryResolver,
    private storage: Storage,
    public translate: TranslateService,
  ) {
    // Listen for completed sections, to continue with next steps
    this.conversationService.updateConversation$.subscribe((nextAction: string) => {
      if (nextAction === this.conversationService.conversationActions.afterLogin) {
        this.loadComponents();
        return;
      }

      this.scrollDown();

      this.insertSection(nextAction);
    });
    // Listen for scroll events
    this.conversationService.shouldScroll$.subscribe((toY: number) => {
      if (toY === -1) {
        return this.scrollDown();
      }

      this.ionContent.scrollToPoint(0, toY, this.scrollSpeed);
    });
  }

  ngOnInit() {
    // Prevent automatic behaviour while debugging/developing:
    if (this.isDebug && this.showDebug) {
      return;
    }

    this.loadComponents();
  }

  ionViewDidEnter() {
    this.scrollDown();
  }

  private async loadComponents() {
    // Always start with a clean slate:
    this.container.clear();

    const conversation = await this.conversationService.getConversationUpToNow();

    conversation.forEach((section: ConversationSection) => {
      this.insertSection(section.name, section.moment, section.data);
    });

    window.setTimeout(() => {
      this.scrollDown();
    }, this.scrollSpeed);
  }

  private getComponentFactory(name: string) {
    return this.resolver.resolveComponentFactory(
      this.availableSections[name]
    );
  }

  public insertSection(name: string, moment?: number, data?: any) {
    if (!name) {
      return;
    }

    console.log('PersonalPage insertSection(): ', name);

    const componentRef = this.container.createComponent(
      this.getComponentFactory(name)
    );
    const componentInstance: PersonalComponent = componentRef.instance;

    componentInstance.moment = moment;
    componentInstance.data = data;
  }

  public scrollDown() {
    this.ionContent.scrollToBottom(this.scrollSpeed);
  }

  public debugClearAllStorage() {
    this.storage.clear();
    window.localStorage.clear();
    window.sessionStorage.clear();
  }

  public debugStartFromHistory() {
    this.loadComponents();
  }
}
