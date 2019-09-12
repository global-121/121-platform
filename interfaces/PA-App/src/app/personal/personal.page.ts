import { Component, ViewChild, OnInit, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { environment } from 'src/environments/environment';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService } from '../services/conversation.service';

import { PersonalComponents } from '../personal-components/personal-components.enum';
import { ChooseCredentialTypeComponent } from '../personal-components/choose-credential-type/choose-credential-type.component';
import { CreatePasswordComponent } from '../personal-components/create-password/create-password.component';
import { EnrollInProgramComponent } from '../personal-components/enroll-in-program/enroll-in-program.component';
import { IdentityFormComponent } from '../personal-components/identity-form/identity-form.component';
import { InitialNeedsComponent } from '../personal-components/initial-needs/initial-needs.component';
import { IntroductionComponent } from '../personal-components/introduction/introduction.component';
import { SelectAppointmentComponent } from '../personal-components/select-appointment/select-appointment.component';
import { SelectCountryComponent } from '../personal-components/select-country/select-country.component';
import { SelectLanguageComponent } from '../personal-components/select-language/select-language.component';
import { SelectProgramComponent } from '../personal-components/select-program/select-program.component';
import { StoreCredentialComponent } from '../personal-components/store-credential/store-credential.component';

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

  public isDebug: boolean = !environment.production;

  public availableSections = {
    [PersonalComponents.chooseCredentialType]: ChooseCredentialTypeComponent,
    [PersonalComponents.createIdentity]: IdentityFormComponent,
    [PersonalComponents.createPassword]: CreatePasswordComponent,
    [PersonalComponents.enrollInProgram]: EnrollInProgramComponent,
    [PersonalComponents.initialNeeds]: InitialNeedsComponent,
    [PersonalComponents.introduction]: IntroductionComponent,
    [PersonalComponents.selectAppointment]: SelectAppointmentComponent,
    [PersonalComponents.selectCountry]: SelectCountryComponent,
    [PersonalComponents.selectLanguage]: SelectLanguageComponent,
    [PersonalComponents.selectProgram]: SelectProgramComponent,
    [PersonalComponents.storeCredential]: StoreCredentialComponent,
  };
  public debugSections = Object.keys(this.availableSections);

  constructor(
    public programsService: ProgramsServiceApiService,
    private conversationService: ConversationService,
    private resolver: ComponentFactoryResolver
  ) {
    // Listen for completed sections, to continue with next steps
    this.conversationService.sectionCompleted$.subscribe((response: string) => {
      this.insertSection(response);
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
    console.log('getComponentFactory() ', name);

    return this.resolver.resolveComponentFactory(
      this.availableSections[name]
    );
  }

  public insertSection(name: string) {
    console.log('PersonalPage insertSection(): ', name);

    this.scrollDown();

    this.container.createComponent(
      this.getComponentFactory(name)
    );
  }

  scrollDown() {
    this.ionContent.scrollToBottom(300);
  }
}
