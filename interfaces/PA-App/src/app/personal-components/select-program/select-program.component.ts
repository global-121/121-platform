import { Component, Input } from '@angular/core';
import { InstanceInformation } from 'src/app/models/instance.model';
import { Program } from 'src/app/models/program.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-select-program',
  templateUrl: './select-program.component.html',
  styleUrls: ['./select-program.component.scss'],
})
export class SelectProgramComponent extends PersonalDirective {
  @Input()
  public data;

  public instanceInformation: InstanceInformation;

  public programs: Program[];
  public programChoice: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public conversationService: ConversationService,
    public translatableString: TranslatableStringService,
    private instanceService: InstanceService,
  ) {
    super();
  }

  ngOnInit() {
    this.getInstanceInformation();

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

  private getInstanceInformation() {
    this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        this.instanceInformation = instanceInformation;
      },
    );
  }

  private async getPrograms() {
    this.conversationService.startLoading();

    this.programs = await this.programsService.getAllPrograms();
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
      return item.id === programId;
    });
  }

  public changeProgram($event) {
    this.programChoice = $event.detail.value;
  }

  public async submitProgram() {
    await this.paData.setCurrentProgramId(this.programChoice);

    this.complete();
  }

  getNextSection() {
    return PersonalComponents.consentQuestion;
  }

  complete() {
    this.isDisabled = true;
    const chosenProgram = this.findProgramById(this.programChoice);

    this.conversationService.onSectionCompleted({
      name: PersonalComponents.selectProgram,
      data: {
        chosenProgram: {
          id: chosenProgram.id,
          title: chosenProgram.title,
          description: chosenProgram.description,
        },
      },
      next: this.getNextSection(),
    });
  }
}
