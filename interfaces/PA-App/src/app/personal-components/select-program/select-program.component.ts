import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';
import { ConversationService } from 'src/app/services/conversation.service';
import { TranslateService } from '@ngx-translate/core';

import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent implements PersonalComponent {
  private languageCode: string;
  private fallbackLanguageCode: string;

  private countryChoice: string;

  public programs: Program[];
  public programChoice: number;
  public program: Program;

  constructor(
    public programsService: ProgramsServiceApiService,
    public storage: Storage,
    public conversationService: ConversationService,
    public translate: TranslateService,
  ) {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
  }

  ngOnInit() {
    this.getLanguageChoice();
    this.getPrograms();
  }

  private getLanguageChoice() {
    this.storage.get('languageChoice').then(value => {
      this.languageCode = value;
    });
  }

  private getPrograms(): any {
    this.storage.get('countryChoice').then(value => {
      this.countryChoice = value;

      this.programsService.getProgramsByCountryId(this.countryChoice).subscribe((response: Program[]) => {
        this.programs = response;

        this.programs.forEach((program: Program, index: number) => {
          this.programs[index].title = this.mapLabelByLanguageCode(program.title);
          this.programs[index].description = this.mapLabelByLanguageCode(program.description);
        });
      });
    });
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
    }

    return label;
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
    return 'enroll-in-program';
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
