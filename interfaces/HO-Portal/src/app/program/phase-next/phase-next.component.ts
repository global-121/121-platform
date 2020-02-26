import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program, ProgramPhase } from 'src/app/models/program.model';

@Component({
  selector: 'app-phase-next',
  templateUrl: './phase-next.component.html',
  styleUrls: ['./phase-next.component.scss'],
})
export class PhaseNextComponent implements OnChanges {
  @Input()
  public programId: number;
  @Input()
  public programPhases: any[];
  @Input()
  public selectedPhase: string;
  @Input()
  public phaseReady: boolean;
  @Output()
  emitNewPhase: EventEmitter<boolean> = new EventEmitter<boolean>();

  public program: Program;
  public activePhaseId: number;
  public activePhase: string;
  public btnAvailable: boolean;
  public programPhasesBackup: any[];
  public btnText: string;

  constructor(
    private programsService: ProgramsServiceApiService,
  ) { }

  private firstChange = true;
  async ngOnChanges(changes: SimpleChanges) {
    if (changes.programPhases && typeof changes.programPhases.currentValue === 'object') {
      this.updatePhases();
      this.firstChange = false;
    }
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string' && this.programPhasesBackup) {
      this.btnAvailable = this.selectedPhase !== ProgramPhase.evaluation;
      this.btnText = this.fillBtnText();
    }
  }

  private async updatePhases() {
    if (this.firstChange) { this.programPhasesBackup = this.programPhases; }
    const activePhase = this.programPhases.find(item => item.active);
    this.activePhaseId = activePhase.id;
    this.activePhase = activePhase.phase;
    this.selectedPhase = this.activePhase;
    this.btnText = activePhase.btnText;
    this.btnAvailable = this.isNotLastPhase();
  }

  private isNotLastPhase() {
    const phases = Object.keys(ProgramPhase);
    const lastPhase = phases[phases.length - 1];
    return this.selectedPhase !== lastPhase;
  }

  private fillBtnText() {
    return this.programPhasesBackup
      .find(item => item.phase === this.selectedPhase)
      .btnText;
  }

  public async advancePhase(phaseId) {
    const nextPhaseId = phaseId + 1;
    const phase = this.programPhases.find(item => item.id === nextPhaseId).phase;
    await this.programsService.advancePhase(this.programId, phase);
    this.emitNewPhase.emit(true);
  }

}
