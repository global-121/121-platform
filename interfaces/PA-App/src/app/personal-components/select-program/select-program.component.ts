import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent implements PersonalComponent {
  private countryChoice: string;
  public programs: any;
  public programChoice: number;
  public program: any;
  public programTitle: string;
  public languageCode: string;

  constructor(
    public programsService: ProgramsServiceApiService,
    public storage: Storage,
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
    this.storage.get('languageChoice').then(value => {
      this.languageCode = value ? value : 'en';
    });
    this.getPrograms();
  }

  private getPrograms(): any {
    this.storage.get('countryChoice').then(value => {
      this.countryChoice = value;

      this.programsService.getProgramsByCountryId(this.countryChoice).subscribe(response => {
        this.programs = response;
      });
    });
  }

  private storeProgram(programChoice: any) {
    this.storage.set('programChoice', programChoice);
  }

  public changeProgram($event) {
    this.programChoice = $event.detail.value;
    this.storeProgram(this.programChoice);
  }

  public submitProgram() {
    this.complete();
  }

  getNextSection() {
    return 'get-program-details';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'select-program',
      data: {
        countryChoice: this.countryChoice,
        programChoice: this.programChoice,
      },
      next: this.getNextSection(),
    });
  }
}
