import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ProgramPhase } from '../models/program.model';
import { PROGRAM_PHASE_ORDER } from '../program-phase-order';
import { ProgramsServiceApiService } from './programs-service-api.service';

export class Phase {
  id: number;
  name: ProgramPhase;
  label: string;
  btnText: string;
  active?: boolean;
  disabled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProgramPhaseService {
  private programId: number;

  public activePhaseName: ProgramPhase;
  private validation: boolean;
  public phases: Phase[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  public async getPhases(programId: number): Promise<Phase[]> {
    if (!this.phases) {
      this.phases = this.createInitialPhases();
    }
    await this.loadProgram(programId);
    this.updatePhase();

    return this.phases;
  }

  private createInitialPhases(): Phase[] {
    return PROGRAM_PHASE_ORDER.map((phase) => ({
      id: phase.id,
      name: phase.name,
      label: this.translate.instant(
        'page.program.phases.' + phase.name + '.label',
      ),
      btnText: this.translate.instant(
        'page.program.phases.' + phase.name + '.btnText',
      ),
    }));
  }

  private async loadProgram(programId: number) {
    this.programId = programId;
    const program = await this.programsService.getProgramById(programId);
    this.activePhaseName = program.phase;
    this.validation = program.validation;
  }

  private updatePhase() {
    // Initially, `activePhase` will only contain `id` and `name` attributes from PROGRAM_PHASE_ORDER definition:
    const activePhase = this.getPhaseByName(this.activePhaseName);

    this.phases = this.phases.map((phase: Phase) => {
      phase.active = phase.name === activePhase.name;
      phase.disabled = phase.id > activePhase.id;

      if (
        !this.validation &&
        phase.name === ProgramPhase.registrationValidation
      ) {
        phase.label = this.translate.instant(
          'page.program.phases.' + phase.name + '.label-no-validation',
        );
        phase.btnText = this.translate.instant(
          'page.program.phases.' + phase.name + '.btnText-no-validation',
        );
      }

      return phase;
    });
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
        async (result) => {
          // When available, use the 'truth' from the back-end
          if (result.phase) {
            this.activePhaseName = result.phase;
          } else {
            // Else, fall back to previous knowledge
            this.activePhaseName = nextPhase.name;
          }
          this.updatePhase();
          const newActivePhase = this.getActivePhase();
          this.router.navigate([
            'program',
            this.programId,
            newActivePhase.name,
          ]);
        },
        (error) => {
          console.log(error);
        },
      );
  }
}
