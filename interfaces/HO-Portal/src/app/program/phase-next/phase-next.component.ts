import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { UserRole } from 'src/app/auth/user-role.enum';
import { AuthService } from 'src/app/auth/auth.service';
import {
  ProgramPhaseService,
  Phase,
} from 'src/app/services/program-phase.service';

@Component({
  selector: 'app-phase-next',
  templateUrl: './phase-next.component.html',
  styleUrls: ['./phase-next.component.scss'],
})
export class PhaseNextComponent implements OnChanges {
  @Input()
  public programId: number;
  @Input()
  public selectedPhase: ProgramPhase;
  @Input()
  public phaseReady: boolean;
  @Output()
  isNewPhase: EventEmitter<boolean> = new EventEmitter<boolean>();

  private programPhases: Phase[];
  private programPhasesBackup: any[];

  public program: Program;
  public activePhase: Phase;

  public btnAvailable: boolean;
  public btnText: string;
  public isInProgress = false;

  private currentUserRole: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private programPhaseService: ProgramPhaseService,
  ) {}

  async ngOnInit() {
    this.currentUserRole = this.authService.getUserRole();
    this.programPhases = await this.programPhaseService.getPhases(
      this.programId,
    );
    this.updatePhases();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.selectedPhase &&
      typeof changes.selectedPhase.currentValue === 'string' &&
      this.programPhasesBackup
    ) {
      this.btnAvailable = this.checkAvailable();
      this.btnText = this.fillBtnText();
    }
  }

  private checkAvailable(): boolean {
    return this.selectedPhase !== ProgramPhase.evaluation;
  }

  public checkDisabled(): boolean {
    return (
      this.selectedPhase !== this.activePhase.name ||
      this.isInProgress ||
      this.currentUserRole !== UserRole.ProjectOfficer
    );
  }

  private async updatePhases() {
    if (!this.programPhasesBackup) {
      this.programPhasesBackup = this.programPhases;
    }
    this.activePhase = this.programPhaseService.getActivePhase();
    this.selectedPhase = this.activePhase.name;
    this.btnText = this.activePhase.btnText;
    this.btnAvailable = this.isNotLastPhase();
  }

  private isNotLastPhase(): boolean {
    const phases = Object.keys(this.programPhases);
    const lastPhase = phases[phases.length - 1];
    return this.selectedPhase !== lastPhase;
  }

  private fillBtnText() {
    return this.programPhasesBackup.find(
      (item) => item.phase === this.selectedPhase,
    ).btnText;
  }

  public async advancePhase(phaseId: number) {
    const nextPhase = this.programPhaseService.getNextPhaseById(phaseId);
    this.isInProgress = true;
    await this.programsService
      .advancePhase(this.programId, nextPhase.name)
      .then(
        () => {
          this.isInProgress = false;
          this.isNewPhase.emit(true);
        },
        (error) => {
          console.log(error);
          this.isInProgress = false;
        },
      );
  }
}
