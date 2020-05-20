import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { ProgramPhase, Program, BulkAction } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { formatDate } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { UserRole } from 'src/app/auth/user-role.enum';
import { BulkActionsService } from 'src/app/services/bulk-actions.service';

@Component({
  selector: 'app-program-people-affected',
  templateUrl: './program-people-affected.component.html',
  styleUrls: ['./program-people-affected.component.scss'],
})
export class ProgramPeopleAffectedComponent implements OnChanges {
  @Input()
  public selectedPhase: string;
  @Input()
  public activePhase: string;
  @Input()
  public programId: number;
  @Input()
  public userRole: UserRole;

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
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public rows: any[] = [];
  public columns: any[] = [];
  public peopleAffected: Person[] = [];
  public selectedPeople: any[] = [];
  private headerChecked = false;
  private countSelected = 0;

  public applyBtnDisabled = true;
  private action = BulkAction.chooseAction;
  public bulkActions = [
    {
      id: BulkAction.chooseAction,
      label: this.translate.instant('page.program.program-people-affected.choose-action'),
      roles: [UserRole.ProjectOfficer, UserRole.ProgramManager],
      phases: [
        ProgramPhase.design,
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.reviewInclusion,
        ProgramPhase.payment,
        ProgramPhase.evaluation
      ]
    },
    {
      id: BulkAction.selectForValidation,
      label: this.translate.instant('page.program.program-people-affected.actions.' + BulkAction.selectForValidation),
      roles: [UserRole.ProjectOfficer],
      phases: [ProgramPhase.registrationValidation]
    }
  ];
  public bulkActionsEnabled = [];

  public submitWarning: any;

  constructor(
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    private bulkActionService: BulkActionsService,
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
        headerCheckboxable: false,
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
      await this.loadData();
      this.loadActions();
    }
    if (changes.activePhase && typeof changes.activePhase.currentValue === 'string') {
      this.loadActions();
    }
    if (changes.userRole && typeof changes.userRole.currentValue === 'string') {
      this.loadActions();
    }
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
  }

  private loadActions() {
    this.bulkActionsEnabled = [];
    for (const action of this.bulkActions) {
      if (action.roles.includes(this.userRole) && action.phases.includes(ProgramPhase[this.activePhase])) {
        this.bulkActionsEnabled.push(action);
      }
    }
  }

  private async loadData() {
    let allPeopleData: any[];
    allPeopleData = await this.programsService.getPeopleAffected(this.programId);
    this.peopleAffected = await this.createTableData(allPeopleData);
  }

  private async createTableData(source: Person[]): Promise<any[]> {
    if (source.length === 0) {
      return [];
    }

    return source
      .sort(this.sortPeopleAffected)
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
          vulnerabilityAssessmentValidated: person.validationDate ? formatDate(person.validationDate, this.dateFormat, this.locale) : null,
          finalScore: person.score,
        };

        return personData;
      });
  }

  private sortPeopleAffected(a, b) {
    if (a.tempScore === b.tempScore) {
      return (a.did > b.did) ? -1 : 1;
    } else {
      return (a.tempScore > b.tempScore) ? -1 : 1;
    }
  }

  public showCheckbox(row) {
    return row.checkboxVisible;
  }

  public selectAction() {
    if (this.action === BulkAction.chooseAction) {
      this.resetBulkAction();
      return;
    }

    this.applyBtnDisabled = false;

    this.peopleAffected = this.recreatePeopleAffected(this.peopleAffected);

    this.toggleHeaderCheckbox();
    this.updateSubmitWarning(this.selectedPeople);

    const nrCheckboxes = this.countCheckboxes(this.peopleAffected);
    if (nrCheckboxes === 0) {
      this.resetBulkAction();
      this.actionResult(this.translate.instant('page.program.program-people-affected.no-checkboxes'));
    }

  }

  private recreatePeopleAffected(peopleAffected) {
    return peopleAffected.map((person) => {
      // BEGIN: For some weird reason, this piece of code is needed for the subsequent checkbox-change to take effect
      // (all simpler variations have been tried)
      const personData: any = {};
      for (const prop in person) {
        if (Object.prototype.hasOwnProperty.call(person, prop)) {
          personData[prop] = person[prop];
        }
      }
      // END

      return this.bulkActionService.updateCheckboxes(this.action, personData);

    });
  }

  private resetBulkAction() {
    this.loadData();
    this.action = BulkAction.chooseAction;
    this.applyBtnDisabled = true;
    this.toggleHeaderCheckbox();
    this.headerChecked = false;
    this.countSelected = 0;
    this.selectedPeople = [];
  }

  private toggleHeaderCheckbox() {
    // Only add header-checkbox with > 1 checkbox
    if (this.countCheckboxes(this.peopleAffected) > 1) {
      const switchedColumn = this.columns.find(i => i.prop === 'selected');
      switchedColumn.headerCheckboxable = !switchedColumn.headerCheckboxable;
      if (switchedColumn && switchedColumn.$$id) {
        this.columns = this.columns.filter(c => c.$$id !== switchedColumn.$$id);
        switchedColumn.$$id = undefined;
        this.columns = [switchedColumn, ...this.columns];
      }
    }
  }

  public onSelect(event) {
    const selected = event.selected;

    // We need to distinguish between the header-select case and the single-row-selection, as they both call the same function
    const diffNewSelected = Math.abs(selected.length - this.countSelected);
    this.countSelected = selected.length;
    const headerSelection = diffNewSelected > 1;

    // This is the single-row-selection case (although it also involves the going from (N-1) to N rows through header-selection)
    if (!headerSelection) {
      this.headerChecked = selected.length < this.countCheckboxes(this.peopleAffected) ? false : true;
      this.selectedPeople = selected;
      this.countSelected = this.selectedPeople.length;
      this.updateSubmitWarning(this.selectedPeople);
      return;
    }

    // This is the header-selection case
    if (!this.headerChecked) { // If checking ...
      const disabledList = [];

      selected.forEach((item, index) => {
        if (!item.checkboxVisible) {
          disabledList.push(index);
        }
      });

      disabledList.reverse().forEach(item => {
        selected.splice(item, 1);
      });

      this.selectedPeople.splice(0, this.selectedPeople.length);
      this.selectedPeople.push(...selected);
      this.updateSubmitWarning(this.selectedPeople);
    } else { // If unchecking ...
      this.selectedPeople = [];
      this.updateSubmitWarning(this.selectedPeople);
    }
    this.headerChecked = !this.headerChecked; // Toggle checked-boolean
    this.countSelected = this.selectedPeople.length;
  }


  private countCheckboxes(rows) {
    return rows.filter(i => i.checkboxVisible).length;
  }

  private updateSubmitWarning(selected) {
    const actionLabel = this.bulkActions.find(i => i.id === this.action).label;
    this.submitWarning.message = `
      ${actionLabel}: ${selected.length} ${this.submitWarning.people}
    `;
  }

  public async applyAction() {
    await this.bulkActionService.applyAction(this.action, this.programId, this.selectedPeople);

    this.resetBulkAction();
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
