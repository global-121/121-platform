import { Component, Input } from '@angular/core';
import { Program } from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent implements ValidationComponent {
  @Input()
  public data;
  public isDisabled: boolean;

  public programs: Program[];
  public programsCount: number;
  public programChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public translatableString: TranslatableStringService,
  ) {}

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
  }

  initHistory() {
    const chosenProgram = this.data.chosenProgram;

    this.programChoice = this.data.chosenProgram.id;
    this.programs = [chosenProgram];
  }

  async initNew() {
    await this.getPrograms();
  }

  private async getPrograms() {
    this.conversationService.startLoading();

    const { programs, programsCount } =
      await this.programsService.getAllPublishedPrograms();
    this.programs = programs;
    this.programsCount = programsCount;
    this.programs = this.translateProgramProperties(this.programs);

    this.conversationService.stopLoading();
  }

  private translateProgramProperties(programs: Program[]) {
    return programs.map((program: Program) => {
      program.titlePaApp = this.translatableString.get(program.titlePaApp);
      program.description = this.translatableString.get(program.description);
      return program;
    });
  }

  private findProgramById(programId: number) {
    return this.programs.find((item: Program) => {
      return item.id === programId;
    });
  }

  public changeProgram($event) {
    this.programChoice = $event.detail.value;
  }

  public async submitProgram() {
    // await this.paData.setCurrentProgramId(this.programChoice);

    this.complete();
  }

  getNextSection() {
    return ValidationComponents.mainMenu;
  }

  complete() {
    this.isDisabled = true;
    const chosenProgram = this.findProgramById(this.programChoice);

    this.conversationService.onSectionCompleted({
      name: ValidationComponents.selectProgram,
      data: {
        chosenProgram: {
          id: chosenProgram.id,
          titlePaApp: chosenProgram.titlePaApp,
          description: chosenProgram.description,
        },
      },
      next: this.getNextSection(),
    });
  }
}
