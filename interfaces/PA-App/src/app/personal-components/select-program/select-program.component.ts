import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ConversationService } from 'src/app/services/conversation.service';
import { TranslateService } from '@ngx-translate/core';

import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent extends PersonalComponent {
  private languageCode: string;
  private fallbackLanguageCode: string;

  private countryChoice: string;

  public programs: Program[];
  public programChoice: number;
  public program: Program;

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public conversationService: ConversationService,
    public translate: TranslateService,
  ) {
    super();

    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;
    this.getPrograms();
  }

  private getPrograms(): any {
    this.conversationService.startLoading();

    this.paData.retrieve(this.paData.type.country).then(value => {
      this.countryChoice = value;

      this.programsService.getProgramsByCountryId(this.countryChoice).subscribe((response: Program[]) => {
        this.programs = response;

        this.programs.forEach((program: Program, index: number) => {
          this.programs[index].title = this.mapLabelByLanguageCode(program.title);
          this.programs[index].description = this.mapLabelByLanguageCode(program.description);
        });

        this.conversationService.stopLoading();
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

  public changeProgram($event) {
    this.programChoice = $event.detail.value;
    this.paData.store(this.paData.type.programId, this.programChoice);
  }

  public submitProgram() {
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.enrollInProgram;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectProgram,
      data: {
        countryChoice: this.countryChoice,
        programChoice: this.programChoice,
      },
      next: this.getNextSection(),
    });
  }
}
