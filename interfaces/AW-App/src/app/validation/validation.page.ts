import { Component, ViewChild, OnInit, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { environment } from 'src/environments/environment';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService, ConversationSection } from '../services/conversation.service';
import { MainMenuComponent } from '../validation-components/main-menu/main-menu.component';
import { ScanQrComponent } from '../validation-components/scan-qr/scan-qr.component';
import { ViewAppointmentsComponent } from '../validation-components/view-appointments/view-appointments.component';
import { ValidateProgramComponent } from '../validation-components/validate-program/validate-program.component';

@Component({
  selector: 'app-validation',
  templateUrl: 'validation.page.html',
  styleUrls: ['validation.page.scss'],
})
export class ValidationPage implements OnInit {
  @ViewChild(IonContent)
  public ionContent: IonContent;

  @ViewChild('conversationContainer', { read: ViewContainerRef })
  public container;

  public isDebug: boolean = !environment.production;

  constructor(
    public programsService: ProgramsServiceApiService,
    private conversationService: ConversationService,
    private resolver: ComponentFactoryResolver
  ) {
    // Listen for completed sections, to continue with next steps
    this.conversationService.sectionCompleted$.subscribe((response: ConversationSection) => {
      this.insertSection(response.next);
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

    const availableSections = {
      'main-menu': MainMenuComponent,
      'scan-qr': ScanQrComponent,
      'view-appointments': ViewAppointmentsComponent,
      'validate-program': ValidateProgramComponent,
    };

    return this.resolver.resolveComponentFactory(
      availableSections[name]
    );
  }

  public insertSection(name: string) {
    console.log('ValidationPage insertSection(): ', name);

    this.scrollDown();

    this.container.createComponent(
      this.getComponentFactory(name)
    );
  }

  scrollDown() {
    this.ionContent.scrollToBottom(300);
  }
}
