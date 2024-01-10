import { Component, Input, OnInit } from '@angular/core';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import {
  Phase,
  ProgramPhaseService,
} from 'src/app/services/program-phase.service';

@Component({
  selector: 'app-phase-next',
  templateUrl: './phase-next.component.html',
  styleUrls: ['./phase-next.component.scss'],
})
export class PhaseNextComponent implements OnInit {
  @Input()
  public programId: number;

  @Input()
  public thisPhaseName: ProgramPhase;

  @Input()
  public phaseReady: boolean;

  private programPhases: Phase[];

  public program: Program;
  public activePhase: Phase;

  public btnAvailable: boolean;
  public btnTextKey: string;
  public isInProgress = false;

  constructor(private programPhaseService: ProgramPhaseService) {}

  async ngOnInit() {
    this.programPhases = await this.programPhaseService.getPhases(
      this.programId,
    );
    this.updatePhases();
    this.btnAvailable = this.checkAvailable();
    this.btnTextKey = this.programPhaseService.getPhaseByName(
      this.thisPhaseName,
    ).btnTextKey;
  }

  private checkAvailable(): boolean {
    return this.thisPhaseName !== ProgramPhase.evaluation;
  }

  public checkDisabled(): boolean {
    return this.thisPhaseName !== this.activePhase.name || this.isInProgress;
  }

  private updatePhases() {
    this.activePhase = this.programPhaseService.getActivePhase();
    this.btnAvailable = this.isNotLastPhase();
  }

  private isNotLastPhase(): boolean {
    const phases = Object.keys(this.programPhases);
    const lastPhase = phases[phases.length - 1];
    return this.thisPhaseName !== lastPhase;
  }

  public async advancePhase() {
    this.isInProgress = true;
    this.programPhaseService.advancePhase().finally(() => {
      this.isInProgress = false;
      this.activePhase = this.programPhaseService.getActivePhase();
    });
  }
}
