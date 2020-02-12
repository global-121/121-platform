import { UserRole } from './../../auth/user-role.enum';
import { AuthService } from './../../auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program } from 'src/app/models/program.model';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ProgramJsonComponent } from '../program-json/program-json.component';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.component.html',
  styleUrls: ['./program-details.component.scss'],
})
export class ProgramDetailsComponent implements OnInit {
  public languageCode: string;
  public fallbackLanguageCode: string;
  public currentUserRole: string;

  public program: Program;
  public programTitle: string;
  public programArray: any;
  public userRoleEnum = UserRole;

  public programPhases: any[] = [];
  public activePhaseId: number;
  public activePhase: string;
  public selectedPhaseId: number;
  public selectedPhase: string;

  private techFeatures = [
    'countryId',
    'schemaId',
    'credDefId',
    'credOffer',
    'proofRequest',
  ];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    public modalController: ModalController,
    public translate: TranslateService,
    private authService: AuthService

  ) { }

  async ngOnInit() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;
    const programId = this.route.snapshot.params.id;
    this.program = await this.programsService.getProgramById(programId);
    this.programTitle = this.mapLabelByLanguageCode(this.program.title);
    this.programArray = this.generateArray(this.program);
    this.currentUserRole = this.authService.getUserRole();
    this.programPhases = this.createPhases();
  }

  public createPhases() {
    const phasesInput = ['design', 'registration', 'inclusion', 'finalize', 'payment', 'evaluation'];
    const phases = phasesInput.map((phase, index) => ({
      id: index + 1,
      phase: phase,
      label: this.translate.instant('page.programs.phases.' + phase),
      active: phase === this.program.state,
    }));
    // Set at 10 to have all sections active, for development purposes phases.
    // this.activePhaseId = 10; 
    this.activePhaseId = phases.find(item => item.active).id;
    this.activePhase = phases.find(item => item.active).phase;
    this.selectedPhaseId = this.activePhaseId;
    this.selectedPhase = this.activePhase;
    return phases
  }

  public changePhase(phase) {
    this.selectedPhase = this.programPhases.find(item => item.id === phase).phase;
    this.selectedPhaseId = this.programPhases.find(item => item.id === phase).id;
  }

  public async advancePhase(phaseId) {
    const phase = this.programPhases.find(item => item.id === phaseId).phase;
    await this.programsService.advancePhase(this.program.id, phase);
    this.program = await this.programsService.getProgramById(this.program.id);
    this.programPhases = this.createPhases();
  }

  public generateArray(obj) {
    return Object.keys(obj)
      .filter((key) => this.techFeatures.indexOf(key) <= -1)
      .map((key) => {
        const keyNew = this.translate.instant('page.programs.program-details.' + key);
        const valueNew = this.mapLabelByLanguageCode(obj[key]);
        let isArray = false;
        if (valueNew instanceof Array) {
          if (typeof valueNew[0] === 'object') {
            isArray = true;
            // Enter code here to visualize array-properties (like Criteria/Aidworkers) differently
          }
        }
        return ({ key: keyNew, value: valueNew, isArray });
      });
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

  async openProgramJson() {
    const modal: HTMLIonModalElement =
      await this.modalController.create({
        component: ProgramJsonComponent,
        componentProps: {
          program: this.program,
        }
      });

    await modal.present();
  }

}
