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

  private phasesInput = [
    ProgramPhase.design,
    ProgramPhase.registration,
    ProgramPhase.inclusion,
    ProgramPhase.finalize,
    ProgramPhase.payment,
    ProgramPhase.evaluation
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
    const phases = this.phasesInput.map((phase, index) => ({
      id: index + 1,
      phase,
      label: this.translate.instant('page.program.phases.' + phase + '.label'),
      active: phase === this.activePhase,
      btnText: this.translate.instant('page.program.phases.' + phase + '.btnText'),
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
