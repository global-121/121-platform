import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  public program: Program;
  public programTitle: string;
  public programArray: any;

  private id: string;

  private techFeatures = [
    'countryId',
    'schemaId',
    'credDefId',
    'credOffer',
    'proofRequest',
  ];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private programsService: ProgramsServiceApiService,
    public modalController: ModalController,
    public translate: TranslateService,
  ) {

  }

  ngOnInit() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;

    this.id = this.route.snapshot.paramMap.get('id');
    this.programsService.getProgramById(this.id).subscribe((response) => {
      this.program = response;
      this.programTitle = this.mapLabelByLanguageCode(this.program.title);
      this.programArray = this.generateArray(this.program);
    });
  }

  public goToPeoplePage() {
    this.router.navigateByUrl('/program/' + this.id + '/people');
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
