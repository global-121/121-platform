import { UserRole } from '../auth/user-role.enum';
import { AuthService } from '../auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';
import { ProgramJsonComponent } from './program-json/program-json.component';

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
  public programPhase: string;

  public selectedPhase: string;

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

    this.programPhase = this.program.state;
    this.selectedPhase = this.programPhase;
  }



  // public async advancePhase(phaseId) {
  //   const phase = this.programPhases.find(item => item.id === phaseId).phase;
  //   await this.programsService.advancePhase(this.program.id, phase);
  //   this.program = await this.programsService.getProgramById(this.program.id);
  //   this.programPhases = this.createPhases();
  // }

  public emit(selectedPhase) {
    this.selectedPhase = selectedPhase;
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
