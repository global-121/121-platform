import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { ProgramJsonComponent } from '../program-json/program-json.component';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.component.html',
  styleUrls: ['./program-details.component.scss'],
})
export class ProgramDetailsComponent implements OnChanges {
  @Input()
  public programId: number;
  @Input()
  public selectedPhase: string;

  public componentVisible: boolean;
  private presentInPhases = [
    ProgramPhase.design
  ];

  public program: Program;
  public programArray: any;
  public languageCode: string;
  public fallbackLanguageCode: string;

  private techFeatures = [
    'countryId',
    'schemaId',
    'credDefId',
    'credOffer',
    'proofRequest',
  ];

  constructor(
    public modalController: ModalController,
    public translate: TranslateService,
    private programsService: ProgramsServiceApiService,
  ) { }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string') {
      this.checkVisibility(this.selectedPhase);
    }
    if (changes.programId && typeof changes.programId.currentValue === 'number') {
      this.update();
    }
  }

  private async update() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;
    this.program = await this.programsService.getProgramById(this.programId);
    this.programArray = this.generateArray(this.program);
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
  }

  public generateArray(obj) {
    return Object.keys(obj)
      .filter((key) => this.techFeatures.indexOf(key) <= -1)
      .map((key) => {
        const keyNew = this.translate.instant('page.program.program-details.' + key);
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
