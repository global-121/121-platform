import { Component, ViewChild, OnInit, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService } from '../services/conversation.service';

import { PersonalComponents } from '../personal-components/personal-components.enum';
import { ChooseCredentialTypeComponent } from '../personal-components/choose-credential-type/choose-credential-type.component';
import { CreateIdentityComponent } from '../personal-components/create-identity/create-identity.component';
import { EnrollInProgramComponent } from '../personal-components/enroll-in-program/enroll-in-program.component';
import { HandleProofComponent } from './../personal-components/handle-proof/handle-proof.component';
import { InitialNeedsComponent } from '../personal-components/initial-needs/initial-needs.component';
import { SelectAppointmentComponent } from '../personal-components/select-appointment/select-appointment.component';
import { SelectCountryComponent } from '../personal-components/select-country/select-country.component';
import { SelectLanguageComponent } from '../personal-components/select-language/select-language.component';
import { SelectProgramComponent } from '../personal-components/select-program/select-program.component';
import { StoreCredentialComponent } from '../personal-components/store-credential/store-credential.component';
import { SignupSigninComponent } from '../personal-components/signup-signin/signup-signin.component';

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
    [PersonalComponents.initialNeeds]: InitialNeedsComponent,
    [PersonalComponents.selectAppointment]: SelectAppointmentComponent,
    [PersonalComponents.selectCountry]: SelectCountryComponent,
    [PersonalComponents.selectLanguage]: SelectLanguageComponent,
    [PersonalComponents.selectProgram]: SelectProgramComponent,
    [PersonalComponents.signupSignin]: SignupSigninComponent,
    [PersonalComponents.storeCredential]: StoreCredentialComponent,
  };
  public debugSections = Object.keys(this.availableSections);

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private resolver: ComponentFactoryResolver,
    private storage: Storage,
  ) {
    // Listen for completed sections, to continue with next steps
    this.conversationService.sectionCompleted$.subscribe((response: string) => {
      this.insertSection(response);
    });
    // Listen for scroll events
    this.conversationService.shouldScroll$.subscribe((toY: number) => {
      if (toY === -1) {
        return this.ionContent.scrollToBottom(this.scrollSpeed);
      }

      this.ionContent.scrollToPoint(0, toY, this.scrollSpeed);
    });
  }

  ngOnInit() {
    this.loadComponents();
  }

  ionViewDidEnter() {
    this.scrollDown();
  }

  private loadComponents() {
    const steps = this.conversationService.getConversationUpToNow();

    for (const step of steps) {
      this.insertSection(step.name);
    }
  }

  private getComponentFactory(name: string) {
    return this.resolver.resolveComponentFactory(
      this.availableSections[name]
    );
  }

  public insertSection(name: string) {
    if (!name) {
      return;
    }

    console.log('PersonalPage insertSection(): ', name);

    this.scrollDown();

    this.container.createComponent(
      this.getComponentFactory(name)
    );
  }

  public scrollDown() {
    this.ionContent.scrollToBottom(this.scrollSpeed);
  }

  public debugClearAllStorage() {
    this.storage.clear();
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
}
