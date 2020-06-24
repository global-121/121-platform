import { Injectable } from '@angular/core';
import { ProgramPhase, Program } from '../models/program.model';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';

export class Phase {
  id: number;
  name: ProgramPhase;
  label: string;
  btnText: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProgramPhaseService {
  private programId: number;

  private program: Program;
  public activePhaseName: string;
  public phases: Phase[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}

  private async loadProgram(programId: number) {
    this.program = await this.programsService.getProgramById(programId);
    this.activePhaseName = this.program.state;
  }

  private createPhases() {
    const phasesInput = [
      {
        id: 1,
        name: ProgramPhase.design,
      },
      {
        id: 2,
        name: ProgramPhase.registrationValidation,
      },
      {
        id: 3,
        name: ProgramPhase.inclusion,
      },
      {
        id: 4,
        name: ProgramPhase.reviewInclusion,
      },
      {
        id: 5,
        name: ProgramPhase.payment,
      },
      {
        id: 6,
        name: ProgramPhase.evaluation,
      },
    ];

    return phasesInput.map((phase) => ({
      id: phase.id,
      name: phase.name,
      label: this.translate.instant(
        'page.program.phases.' + phase.name + '.label',
      ),
      btnText: this.translate.instant(
        'page.program.phases.' + phase.name + '.btnText',
      ),
      active: phase.name === this.activePhaseName,
    }));
  }

  public async getPhases(programId: number): Promise<Phase[]> {
    if (!this.phases) {
      await this.loadProgram(programId);
      this.phases = this.createPhases();
    }
    return this.phases;
  }

  public getActivePhase(): Phase {
    console.log('getActivePhase()', this.phases);
    return this.phases.find((phase) => phase.active);
  }

  public getNextPhaseById(phaseId: number): Phase | null {
    const nextPhaseId = phaseId + 1;
    const nextPhase = this.phases.find((phase) => phase.id === nextPhaseId);
    return nextPhase ? nextPhase : null;
  }
}
