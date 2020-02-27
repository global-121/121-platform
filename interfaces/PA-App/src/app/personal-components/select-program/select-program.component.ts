import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ConversationService } from 'src/app/services/conversation.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent extends PersonalComponent {
  @Input()
  public data;

  private countryChoice: string;

  public programs: Program[];
  public programChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public conversationService: ConversationService,
    public translatableString: TranslatableStringService,
  ) {
    super();
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
    this.programs = this.translateProgramProperties(this.programs);

    this.conversationService.stopLoading();
  }

  private translateProgramProperties(programs: Program[]) {
    return programs.map((program: Program) => {
      program.title = this.translatableString.get(program.title);
      program.description = this.translatableString.get(program.description);
      return program;
    });
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
