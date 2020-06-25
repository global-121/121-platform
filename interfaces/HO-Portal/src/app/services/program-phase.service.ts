import { Injectable } from '@angular/core';
import { ProgramPhase, Program } from '../models/program.model';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, Route } from '@angular/router';
import { camelCase2Kebab } from '../shared/camelcase-to-kebabcase';

export class Phase {
  id: number;
  name: ProgramPhase;
  path: Route['path'] | string;
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
    private router: Router,
  ) {}

  private async loadProgram(programId: number) {
    this.programId = programId;
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
      path: camelCase2Kebab(phase.name),
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
      await this.updatePhases(programId);
    }
    return this.phases;
  }

  private async updatePhases(programId: number) {
    await this.loadProgram(programId);
    this.phases = this.createPhases();
  }

  public getActivePhase(): Phase {
    return this.phases.find((phase) => phase.active);
  }

  public getPhaseByName(name: ProgramPhase): Phase {
    return this.phases.find((phase) => phase.name === name);
  }

  public getNextPhase(): Phase | null {
    const activePhase = this.getActivePhase();
    const nextPhaseId = activePhase.id + 1;
    return this.phases.find((phase) => phase.id === nextPhaseId);
  }

  public async advancePhase(): Promise<void> {
    const nextPhase = this.getNextPhase();

    await this.programsService
      .advancePhase(this.programId, nextPhase.name)
      .then(
        async () => {
          await this.updatePhases(this.programId);
          const newActivePhase = this.getActivePhase();
          this.router.navigate([
            'program',
            this.programId,
            newActivePhase.path,
          ]);
        },
        (error) => {
          console.log(error);
        },
      );
  }
}
