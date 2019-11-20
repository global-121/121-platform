import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program } from 'src/app/models/program.model';
import { ModalController } from '@ionic/angular';
import { ProgramModalPage } from '../program-modal/program-modal.page';
import { OverlayEventDetail } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';

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
  ) {

  }

  ngOnInit() {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;

    const id = this.route.snapshot.paramMap.get('id');
    this.programsService.getProgramById(id).subscribe((response) => {
      this.program = response;
      this.programTitle = this.mapLabelByLanguageCode(this.program.title);
      this.programArray = this.generateArray(this.program);
    });
  }



  public generateArray(obj) {
    const result = [];
    for (const key in obj) {
      if (this.techFeatures.indexOf(key) <= -1) {

        const keyNew = this.translate.instant('page.programs.program-details.' + key);
        const valueNew = this.mapLabelByLanguageCode(obj[key]);

        let isArray = false;
        if (valueNew instanceof Array) {
          if (typeof valueNew[0] === 'object') {
            isArray = true;
            // Enter code here to visualize array-properties (like Criteria/Aidworkers) differently
          }
        }
        result.push(({ key: keyNew, value: valueNew, isArray }));
      }
    }
    return result;
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

  async openModal() {
    const modal: HTMLIonModalElement =
      await this.modalController.create({
        component: ProgramModalPage,
        componentProps: {
          program: this.program,
        }
      });

    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      if (detail !== null) {
        console.log('The result:', detail.data);
      }
    });

    await modal.present();
  }

}
