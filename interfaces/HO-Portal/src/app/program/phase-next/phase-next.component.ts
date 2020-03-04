import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { UserRole } from 'src/app/auth/user-role.enum';
import { AuthService } from 'src/app/auth/auth.service';

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
  isNewPhase: EventEmitter<boolean> = new EventEmitter<boolean>();

  public program: Program;
  public activePhaseId: number;
  public activePhase: string;
  public btnAvailable: boolean;
  public programPhasesBackup: any[];
  public btnText: string;
  public isInProgress = false;
  private currentUserRole: string;

  private firstChange = true;

  constructor(
    private programsService: ProgramsServiceApiService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    this.currentUserRole = this.authService.getUserRole();
  }

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

  public checkDisabled() {
    return this.selectedPhase !== this.activePhase
      || !this.phaseReady
      || this.isInProgress
      || this.currentUserRole !== UserRole.ProgramManager;
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
    this.isInProgress = true;
    await this.programsService.advancePhase(this.programId, phase).then((response) => {
      this.isInProgress = false;
      this.isNewPhase.emit(true);
    }, (error) => {
      console.log(error);
      this.isInProgress = false;
    });
  }

}
