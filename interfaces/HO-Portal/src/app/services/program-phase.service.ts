import { Injectable } from '@angular/core';
import { ProgramPhase, Program } from '../models/program.model';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PROGRAM_PHASE_ORDER } from '../program-phase-order';

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
    this.updatePhaseStates();

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
    this.activePhaseName = program.state;
  }

  private updatePhaseStates() {
    // Initially, `activePhase` will only contain `id` and `name` attributes from PROGRAM_PHASE_ORDER definition:
    const activePhase = this.getPhaseByName(this.activePhaseName);

    this.phases = this.phases.map((phase: Phase) => {
      phase.active = phase.name === activePhase.name;
      phase.disabled = phase.id > activePhase.id;

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
          if (result.state) {
            this.activePhaseName = result.state;
          } else {
            // Else, fall back to previous knowledge
            this.activePhaseName = nextPhase.name;
          }
          this.updatePhaseStates();
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
