import { UserRole } from '../auth/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';
import { TranslatableStringService } from '../services/translatable-string.service';

@Component({
  selector: 'app-program',
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.scss'],
})
export class ProgramComponent implements OnInit {

  public currentUserRole: string;

  public program: Program;
  public programTitle: string;
  public programArray: any;
  public userRoleEnum = UserRole;
  public activePhase: string;
  public selectedPhase: string;
  public programPhases: any[];
  public phaseReady = false;
  public phaseReadyPayout = false;
  public phaseReadyPeople = false;

  private phasesInput = [
    {
      id: 1,
      name: ProgramPhase.design,
    },
    {
      id: 2,
      name: ProgramPhase.registration,
    },
    {
      id: 3,
      name: ProgramPhase.inclusion,
    },
    {
      id: 4,
      name: ProgramPhase.finalize,
    },
    {
      id: 5,
      name: ProgramPhase.payment,
    },
    {
      id: 6,
      name: ProgramPhase.evaluation,
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    private translatableString: TranslatableStringService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    const programId = this.route.snapshot.params.id;
    this.program = await this.programsService.getProgramById(programId);
    this.programTitle = this.translatableString.get(this.program.title);

    this.currentUserRole = this.authService.getUserRole();

    this.activePhase = this.program.state;
    this.selectedPhase = this.activePhase;
    this.programPhases = this.createPhases();
  }

  public createPhases() {
    const phases = this.phasesInput.map((phase) => ({
      id: phase.id,
      phase: phase.name,
      label: this.translate.instant('page.program.phases.' + phase.name + '.label'),
      btnText: this.translate.instant('page.program.phases.' + phase.name + '.btnText'),
      active: phase.name === this.activePhase,
    }));
    return phases;
  }

  public emitSelectedPhase(selectedPhase) {
    this.selectedPhase = selectedPhase;
  }
  public emitProgramPhases(programPhases) {
    this.programPhases = programPhases;
  }
  public async emitNewPhase(newPhase) {
    if (newPhase) {
      this.program = await this.programsService.getProgramById(this.program.id);
      this.activePhase = this.program.state;
      this.selectedPhase = this.activePhase;
      this.programPhases = this.createPhases();
    }
  }

  public async emitPayoutCompleted(completed) {
    if (completed) {
      this.phaseReadyPayout = true;
    } else {
      this.phaseReadyPayout = false;
    }
    this.checkPhaseReady();
  }

  public async emitPeopleCompleted(completed) {
    if (completed) {
      this.phaseReadyPeople = true;
    } else {
      this.phaseReadyPeople = false;
    }
    this.checkPhaseReady();
  }

  private checkPhaseReady() {
    this.phaseReady = this.phaseReadyPayout === true && this.phaseReadyPeople === true;
  }

}
