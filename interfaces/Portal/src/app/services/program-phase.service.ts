import { Injectable } from '@angular/core';
import { ProgramPhase } from '../models/program.model';
import { PROGRAM_PHASE_ORDER } from '../program-phase-order';

export class Phase {
  id: number;
  name: ProgramPhase;
  labelKey: string;
  btnTextKey: string;
  active?: boolean;
  disabled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProgramPhaseService {
  public activePhaseName: ProgramPhase;
  public phases: Phase[];

  public async getPhases(): Promise<Phase[]> {
    if (!this.phases) {
      this.phases = this.createInitialPhases();
    }
    this.updatePhase();

    return this.phases;
  }

  private createInitialPhases(): Phase[] {
    return PROGRAM_PHASE_ORDER.map((phase) => ({
      id: phase.id,
      name: phase.name,
      labelKey: `page.program.phases.${phase.name}.label`,
      btnTextKey: `page.program.phases.${phase.name}.btnText`,
    }));
  }

  private updatePhase() {
    // Initially, `activePhase` will only contain `id` and `name` attributes from PROGRAM_PHASE_ORDER definition:
    // TODO: Phase needs to be renamed and
    this.phases = this.phases.map((phase: Phase) => {
      phase.active = phase.name === ProgramPhase.registrationValidation;
      return phase;
    });
  }

  public getPhaseByName(name: ProgramPhase): Phase {
    return this.phases.find((phase) => phase.name === name);
  }
}
