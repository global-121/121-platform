import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { ProgramPhase, Program, BulkAction } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { formatDate } from '@angular/common';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-program-people-affected',
  templateUrl: './program-people-affected.component.html',
  styleUrls: ['./program-people-affected.component.scss'],
})
export class ProgramPeopleAffectedComponent implements OnChanges {
  @Input()
  public selectedPhase: string;
  @Input()
  public programId: number;

  public componentVisible: boolean;
  private presentInPhases = [
    ProgramPhase.design,
    ProgramPhase.registrationValidation,
    ProgramPhase.inclusion,
    ProgramPhase.reviewInclusion,
    ProgramPhase.payment,
    ProgramPhase.evaluation
  ];
  public program: Program;
  private locale: string;
  private dateFormat = 'yyyy-MM-dd, hh:mm';

  public rows: any[] = [];
  public columns: any[] = [];
  public peopleAffected: Person[] = [];
  public selectedPeople: any[] = [];

  public applyBtnDisabled = true;
  private action: BulkAction;
  public bulkActions = [
    {
      id: BulkAction.selectForValidation,
      label: this.translate.instant('page.program.program-people-affected.actions.' + BulkAction.selectForValidation),
    }
  ];

  public submitWarning: any;

  constructor(
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = this.translate.getBrowserCultureLang();

    this.submitWarning = {
      message: '',
      people: this.translate.instant('page.program.program-people-affected.submit-warning-people-affected'),
    };

    this.columns = [
      {
        prop: 'selected',
        name: this.translate.instant('page.program.program-people-affected.column.select'),
        checkboxable: true,
        draggable: false,
        resizeable: false,
        sortable: false,
        hidePhases: []
      },
      {
        prop: 'pa',
        name: this.translate.instant('page.program.program-people-affected.column.person'),
        draggable: false,
        resizeable: false,
        sortable: false,
        hidePhases: []
      },
      {
        prop: 'digitalIdCreated',
        name: this.translate.instant('page.program.program-people-affected.column.digital-id-created'),
        draggable: false,
        resizeable: false,
        hidePhases: []
      },
      {
        prop: 'vulnerabilityAssessmentCompleted',
        name: this.translate.instant('page.program.program-people-affected.column.vulnerability-assessment-completed'),
        draggable: false,
        resizeable: false,
        hidePhases: []
      },
      {
        prop: 'tempScore',
        name: this.translate.instant('page.program.program-people-affected.column.temp-score'),
        draggable: false,
        resizeable: false,
        hidePhases: []
      },
      {
        prop: 'selectedForValidation',
        name: this.translate.instant('page.program.program-people-affected.column.selected-for-validation'),
        draggable: false,
        resizeable: false,
        hidePhases: []
      },
      {
        prop: 'scannedQrCode',
        name: this.translate.instant('page.program.program-people-affected.column.scanned-qr'),
        draggable: false,
        resizeable: false,
        hidePhases: []
      },
      {
        prop: 'vulnerabilityAssessmentValidated',
        name: this.translate.instant('page.program.program-people-affected.column.vulnerability-assessment-validated'),
        draggable: false,
        resizeable: false,
        hidePhases: []
      },
      {
        prop: 'finalScore',
        name: this.translate.instant('page.program.program-people-affected.column.final-score'),
        draggable: false,
        resizeable: false,
        hidePhases: []
      }
    ];
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string') {
      this.checkVisibility(this.selectedPhase);
      this.loadData();
    }
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
  }

  private async loadData() {
    let allPeopleData: any[];
    allPeopleData = await this.programsService.getPeopleAffected(this.programId);
    this.peopleAffected = await this.createTableData(allPeopleData);
    console.log('Data loaded');
  }

  private async createTableData(source: Person[]): Promise<any[]> {
    if (source.length === 0) {
      return [];
    }

    return source
      .sort((a, b) => {
        if (a.tempScore === b.tempScore) {
          return (a.did > b.did) ? -1 : 1;
        } else {
          return (a.tempScore > b.tempScore) ? -1 : 1;
        }
      })
      .map((person, index) => {
        const personData: any = {
          did: person.did,
          checkboxVisible: false,
          pa: `PA #${index + 1}`,
          digitalIdCreated: person.created ? formatDate(person.created, this.dateFormat, this.locale) : null,
          vulnerabilityAssessmentCompleted: person.appliedDate ? formatDate(person.appliedDate, this.dateFormat, this.locale) : null,
          tempScore: person.tempScore,
          selectedForValidation: person.selectedForValidationDate
            ? formatDate(person.selectedForValidationDate, this.dateFormat, this.locale)
            : null,
          scannedQrCode: person.scannedQrDate ? formatDate(person.scannedQrDate, this.dateFormat, this.locale) : null,
          vulnerabilityAssessmentValidated: person.validationDate ? formatDate(person.validationDate, this.dateFormat, this.locale) : null,
          finalScore: person.score,
        };

        return personData;
      });
  }

  public showCheckbox(row) {
    return row.checkboxVisible;
  }

  public selectAction(action) {
    this.action = action;
    this.applyBtnDisabled = false;

    this.peopleAffected = this.peopleAffected.map((person) => {
      //BEGIN: For some weird reason, this piece of code is needed for the checkbox-change to take effect (all simpler variations have been tried)
      let personData: any = {};
      for (var prop in person) {
        if (Object.prototype.hasOwnProperty.call(person, prop)) {
          personData[prop] = person[prop];
        }
      }
      //END

      if (this.action === BulkAction.selectForValidation) {
        personData.checkboxVisible = personData.tempScore && !personData.selectedForValidation ? true : false;
      }

      return personData;
    });
    this.updateSubmitWarning();
    this.countCheckboxes(this.peopleAffected);

  }

  private countCheckboxes(people) {
    const nrCheckboxes = people.filter(i => i.checkboxVisible).length;
    if (nrCheckboxes === 0) {
      this.actionResult(this.translate.instant('page.program.program-people-affected.no-checkboxes'));
      this.action = null;
      this.applyBtnDisabled = true;
    }
  }

  public updateSubmitWarning() {
    const actionLabel = this.bulkActions.find(i => i.id === this.action).label;
    this.submitWarning.message = `
      ${actionLabel}: ${this.selectedPeople.length} ${this.submitWarning.people}
    `;
  }

  public async applyAction() {
    if (this.action === BulkAction.selectForValidation) {
      await this.programsService.selectForValidation(this.programId, this.selectedPeople);
      this.loadData();
      this.action = null;
      this.applyBtnDisabled = true;
    }
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [
        this.translate.instant('common.ok'),
      ],
    });

    await alert.present();
  }

}
