import { Component, Input } from '@angular/core';
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
  @Input()
  public data;

  private languageCode: string;
  private fallbackLanguageCode: string;

  private countryChoice: string;

  public programs: Program[];
  public programChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public conversationService: ConversationService,
    public translate: TranslateService,
  ) {
    super();

    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
  }

  initHistory() {
    this.isDisabled = true;
    const chosenProgram = this.data.chosenProgram;

    this.programChoice = this.data.chosenProgram.id;
    this.programs = [chosenProgram];
  }

  async initNew() {
    await this.getPrograms();
  }

  private async getPrograms() {
    this.conversationService.startLoading();

    this.countryChoice = await this.paData.retrieve(this.paData.type.country);
    this.programs = await this.programsService.getProgramsByCountryId(this.countryChoice);
    this.programs = this.filterProgramsByLanguageCode(this.programs);

    this.conversationService.stopLoading();
  }

  private filterProgramsByLanguageCode(programs: Program[]) {
    programs.forEach((program: Program, index: number) => {
      programs[index].title = this.mapLabelByLanguageCode(program.title);
      programs[index].description = this.mapLabelByLanguageCode(program.description);
    });
    return programs;
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
    }

    if (!label) {
      label = property;
    }

    return label;
  }

  private findProgramById(programId: number) {
    return this.programs.find((item: Program) => {
      return (item.id === programId);
    });
  }

  public changeProgram($event) {
    this.programChoice = $event.detail.value;
    this.paData.store(this.paData.type.programId, this.programChoice);
  }

  public submitProgram() {
    const initialProgram = new Program();
    initialProgram.id = this.programChoice;

    this.paData.saveProgram(this.programChoice, initialProgram);

    this.complete();
  }

  getNextSection() {
    return PersonalComponents.enrollInProgram;
  }

  complete() {
    this.isDisabled = true;
    const chosenProgram = this.findProgramById(this.programChoice);

    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectProgram,
      data: {
        chosenProgram: {
          id: chosenProgram.id,
          ngo: chosenProgram.ngo,
          title: chosenProgram.title,
          description: chosenProgram.description,
        },
      },
      next: this.getNextSection(),
    });
  }
}
