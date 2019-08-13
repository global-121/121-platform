import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  providers: [ProgramsServiceApiService]
})
export class Tab2Page {
  @ViewChild(IonContent)
  public ionContent: IonContent;

  public isDebug: boolean = !environment.production;

  public countries: any = null;
  public countryChoice: number = null;
  public programs: any = null;

  public conversation = [];

  myTurn = false;

  constructor(
    public programsService: ProgramsServiceApiService,
  ) { }

  // public async login(email: string, password: string): Promise<void> {
  //   await this.programsService.login(email, password);
  // }

  public getCountries(): any {
    this.programsService.getCountries().subscribe(response => {
      this.countries = response;
    });
  }

  // public getAllPrograms(): any {
  //   this.programsService.getAllPrograms().subscribe(response => {
  //     this.programs = response;
  //   });
  // }

  public getProgramsByCountryId(countryId: number): any {
    this.programsService.getProgramsByCountryId(countryId).subscribe(response => {
      this.programs = response;
    });
  }

  getActor(isMe: boolean = false) {
    return isMe ? 'self' : 'system';
  }

  getRandomHello() {
    const hellos = [
      'hello',
      'hallo',
      'hey',
      'hi',
      'ola',
      'allo',
    ];

    return hellos[Math.floor(Math.random() * hellos.length)];
  }

  addTurn(theActor: string, theContent: any) {
    this.conversation.push({
      actor: theActor,
      content: theContent,
    });
  }

  public sayHello() {
    console.log('Hello!');
    this.addTurn(this.getActor(this.myTurn), this.getRandomHello());
    this.myTurn = !this.myTurn;

    // Wait for the elements to be added to the DOM before scrolling down
    setTimeout(() => {
      this.ionContent.scrollToBottom();
    }, 100);
  }
}
