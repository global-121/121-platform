import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program } from 'src/app/models/program.model';

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
      this.btnAvailable = this.selectedPhase !== 'evaluation';
      this.btnText = this.programPhasesBackup.find(item => item.phase === this.selectedPhase).btnText;
    }
  }

  private async updatePhases() {
    if (this.firstChange) { this.programPhasesBackup = this.programPhases; }
    this.activePhaseId = this.programPhases.find(item => item.active).id;
    this.activePhase = this.programPhases.find(item => item.active).phase;
    this.selectedPhase = this.activePhase;
    this.btnText = this.programPhases.find(item => item.active).btnText;
    this.btnAvailable = this.selectedPhase !== 'evaluation';
  }

  public async advancePhase(phaseId) {
    const phase = this.programPhases.find(item => item.id === phaseId).phase;
    await this.programsService.advancePhase(this.programId, phase);
    this.emitNewPhase.emit(true);
  }

}
