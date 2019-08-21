import { Component, ViewChild, OnInit, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { IonContent, NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ConversationService } from '../services/conversation.service';

@Component({
  selector: 'app-personal',
  templateUrl: 'personal.page.html',
  styleUrls: ['personal.page.scss'],
})
export class PersonalPage {
  @ViewChild(IonContent)
  public ionContent: IonContent;

  @ViewChild('conversationContainer', { read: ViewContainerRef })
  public container;

  public isDebug: boolean = !environment.production;

  public timeslots: any;
  public timeslotChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    private conversationService: ConversationService,
    private resolver: ComponentFactoryResolver
  ) { }

  ngOnInit() {
    this.loadComponents();
  }

  ionViewDidEnter() {
    this.scrollDown();
  }

  private loadComponents() {
    const steps = this.conversationService.getComponents();

    for (const step of steps) {
      const factory = this.resolver.resolveComponentFactory(step.component);
      this.container.createComponent(factory);
    }
  }

  public getProgramById(programId: number): any {
    this.programsService.getProgramById(programId).subscribe(response => {
      this.program = [];
      this.programTitle = response.title;
      const details = ['description', 'distributionChannel'];
      for (const detail of details) {
        this.program.push({ key: detail, value: response[detail] });
      }
    });
  }

  public getTimeslots(programId: number): any {
    this.programsService.getTimeslots(programId).subscribe(response => {
      this.timeslots = response[0];
    });
  }

  public postAppointment(timeslotId: number, did: string): any {
    this.programsService.postAppointment(timeslotId, did).subscribe(response => {
      console.log('response: ', response);
    });
  }

  scrollDown() {
    // Wait for elements to be added to the DOM before scrolling down
    setTimeout(() => {
      this.ionContent.scrollToBottom(300);
    }, 100);
  }
}
