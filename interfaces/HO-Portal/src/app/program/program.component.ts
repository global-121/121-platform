import { UserRole } from '../auth/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-program',
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.scss'],
})
export class ProgramComponent implements OnInit {
  public languageCode: string;
  public fallbackLanguageCode: string;

  public currentUserRole: string;

  public program: Program;
  public programTitle: string;
  public programArray: any;
  public userRoleEnum = UserRole;
  public activePhase: string;
  public selectedPhase: string;
  public programPhases: any[];
  public phaseReady: boolean = false;
  public phaseReadyPayout: boolean = false;
  public phaseReadyPeople: boolean = false;

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
    private authService: AuthService

  ) { }

  async ngOnInit() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;
    const programId = this.route.snapshot.params.id;
    this.program = await this.programsService.getProgramById(programId);
    this.programTitle = this.mapLabelByLanguageCode(this.program.title);
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

  // public updatePhases() {
  //   this.programPhases.map(phase => phase.active = phase.name === this.activePhase);
  // }

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
    console.log(this.phaseReadyPayout, this.phaseReadyPeople);
    this.phaseReady = this.phaseReadyPayout === true && this.phaseReadyPeople === true;
    console.log(this.phaseReady);
  }

  public async emitPeopleCompleted(completed) {
    if (completed) {
      this.phaseReadyPeople = true;
    } else {
      this.phaseReadyPeople = false;
    }
    console.log(this.phaseReadyPayout, this.phaseReadyPeople);
    this.phaseReady = this.phaseReadyPayout === true && this.phaseReadyPeople === true;
    console.log(this.phaseReady);
  }

  private mapLabelByLanguageCode(property: any) {
    let label = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
    }

    if (!label) {
      label = property;
    }

    return label;
  }



}
