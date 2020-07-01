import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ProgramPhase, Program } from 'src/app/models/program.model';
import { TranslateService } from '@ngx-translate/core';
import { Person, PersonRow } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { formatDate } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { UserRole } from 'src/app/auth/user-role.enum';
import { BulkActionsService } from 'src/app/services/bulk-actions.service';
import { BulkActionId, BulkAction } from 'src/app/models/bulk-actions.models';

@Component({
  selector: 'app-program-people-affected',
  templateUrl: './program-people-affected.component.html',
  styleUrls: ['./program-people-affected.component.scss'],
})
export class ProgramPeopleAffectedComponent implements OnInit {
  @Input()
  public programId: number;
  @Input()
  public userRole: UserRole;
  @Input()
  public thisPhase: ProgramPhase;
  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public program: Program;
  public activePhase: ProgramPhase;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public columns: any[] = [];
  public columnsAvailable: any[] = [];

  public allPeopleAffected: PersonRow[] = [];
  public selectedPeople: PersonRow[] = [];

  public headerChecked = false;
  public headerSelectAllVisible = false;

  public applyBtnDisabled = true;
  public action = BulkActionId.chooseAction;
  public bulkActions: BulkAction[] = [
    {
      id: BulkActionId.chooseAction,
      enabled: true,
      label: this.translate.instant(
        'page.program.program-people-affected.choose-action',
      ),
      roles: [UserRole.ProjectOfficer, UserRole.ProgramManager],
      phases: [
        ProgramPhase.design,
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.reviewInclusion,
        ProgramPhase.payment,
        ProgramPhase.evaluation,
      ],
    },
    {
      id: BulkActionId.selectForValidation,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.select-for-validation',
      ),
      roles: [UserRole.ProjectOfficer],
      phases: [ProgramPhase.registrationValidation],
    },
  ];

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
      people: this.translate.instant(
        'page.program.program-people-affected.submit-warning-people-affected',
      ),
    };

    const columnDefaults = {
      draggable: false,
      resizeable: false,
      sortable: true,
      headerClass: 'ion-text-wrap ion-align-self-end',
    };
    const columnDateWidth = 142;
    const columnScoreWidth = 90;
    this.columnsAvailable = [
      {
        prop: 'pa',
        name: this.translate.instant(
          'page.program.program-people-affected.column.person',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        minWidth: 80,
      },
      {
        prop: 'status',
        name: this.translate.instant(
          'page.program.program-people-affected.column.status',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        minWidth: 80,
      },
      {
        prop: 'digitalIdCreated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.digital-id-created',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateWidth,
      },
      {
        prop: 'vulnerabilityAssessmentCompleted',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-completed',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateWidth,
      },
      {
        prop: 'tempScore',
        name: this.translate.instant(
          'page.program.program-people-affected.column.temp-score',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnScoreWidth,
      },
      {
        prop: 'selectedForValidation',
        name: this.translate.instant(
          'page.program.program-people-affected.column.selected-for-validation',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateWidth,
      },
      {
        prop: 'vulnerabilityAssessmentValidated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-validated',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateWidth,
      },
      {
        prop: 'finalScore',
        name: this.translate.instant(
          'page.program.program-people-affected.column.final-score',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        width: columnScoreWidth,
      },
      {
        prop: 'included',
        name: this.translate.instant(
          'page.program.program-people-affected.column.included',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.inclusion],
        width: columnDateWidth,
      },
    ];

    this.loadColumns();
  }

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);
    this.activePhase = this.program.state;

    this.loadColumns();

    await this.loadData();

    this.updateBulkActions();
  }

  private loadColumns() {
    this.columns = [];
    for (const column of this.columnsAvailable) {
      if (column.phases.includes(this.thisPhase)) {
        this.columns.push(column);
      }
    }
  }

  private updateBulkActions() {
    this.bulkActions = this.bulkActions.map((action) => {
      action.enabled =
        action.roles.includes(this.userRole) &&
        action.phases.includes(this.activePhase);
      return action;
    });
  }



  private async loadData() {
    const allPeopleData = await this.programsService.getPeopleAffected(
      this.programId,
    );
    this.allPeopleAffected = this.createTableData(allPeopleData);
  }

  private createTableData(source: Person[]): PersonRow[] {
    if (source.length === 0) {
      return [];
    }
    return source
      .sort(this.sortPeopleByTempScore)
      .map((person, index) => this.createPersonRow(person, index + 1));
  }

  private sortPeopleByTempScore(a: Person, b: Person) {
    if (a.tempScore === b.tempScore) {
      return a.did > b.did ? -1 : 1;
    } else {
      return a.tempScore > b.tempScore ? -1 : 1;
    }
  }

  private createPersonRow(person: Person, index: number): PersonRow {
    return {
      did: person.did,
      checkboxVisible: false,
      pa: `PA #${index}`,
      status: this.translate.instant(
        'page.program.program-people-affected.status.' + person.status,
      ),
      digitalIdCreated: person.created
        ? formatDate(person.created, this.dateFormat, this.locale)
        : null,
      vulnerabilityAssessmentCompleted: person.appliedDate
        ? formatDate(person.appliedDate, this.dateFormat, this.locale)
        : null,
      tempScore: person.tempScore,
      selectedForValidation: person.selectedForValidationDate
        ? formatDate(
            person.selectedForValidationDate,
            this.dateFormat,
            this.locale,
          )
        : null,
      vulnerabilityAssessmentValidated: person.validationDate
        ? formatDate(person.validationDate, this.dateFormat, this.locale)
        : null,
      finalScore: person.score,

      included: person.inclusionDate
        ? formatDate(person.inclusionDate, this.dateFormat, this.locale)
        : null,
    } as PersonRow;
  }

  public selectAction() {
    if (this.action === BulkActionId.chooseAction) {
      this.resetBulkAction();
      return;
    }

    this.applyBtnDisabled = false;

    this.allPeopleAffected = this.updatePeopleForAction(
      this.allPeopleAffected,
      this.action,
    );

    this.toggleHeaderCheckbox();
    this.updateSubmitWarning(this.selectedPeople.length);

    const nrCheckboxes = this.countSelectable(this.allPeopleAffected);
    if (nrCheckboxes === 0) {
      this.resetBulkAction();
      this.actionResult(
        this.translate.instant(
          'page.program.program-people-affected.no-checkboxes',
        ),
      );
    }
  }

  private updatePeopleForAction(people: PersonRow[], action: BulkActionId) {
    return people.map((person) =>
      this.bulkActionService.updateCheckbox(action, person),
    );
  }

  private resetBulkAction() {
    this.loadData();
    this.action = BulkActionId.chooseAction;
    this.applyBtnDisabled = true;
    this.toggleHeaderCheckbox();
    this.headerChecked = false;
    this.selectedPeople = [];
  }

  private toggleHeaderCheckbox() {
    if (this.countSelectable(this.allPeopleAffected) < 1) {
      return;
    }
    this.headerSelectAllVisible = !this.headerSelectAllVisible;
  }

  public isRowSelectable(row: PersonRow): boolean {
    return row.checkboxVisible || false;
  }

  public onSelect(newSelected: PersonRow[]) {
    const allSelectable = this.allPeopleAffected.filter(this.isRowSelectable);
    const prevSelectedCount = this.selectedPeople.length;
    const cleanNewSelected = newSelected.filter(this.isRowSelectable);

    // We need to distinguish between the header-select case and the single-row-selection, as they both call the same function
    const diffNewSelected = Math.abs(newSelected.length - prevSelectedCount);
    const multiSelection = diffNewSelected > 1;

    if (!multiSelection) {
      // This is the single-row-selection case (although it also involves the going from (N-1) to N rows through header-selection)
      this.selectedPeople = cleanNewSelected;
      this.headerChecked = cleanNewSelected.length === allSelectable.length;
    } else {
      // This is the header-selection case
      if (!this.headerChecked) {
        // If checking ...
        this.selectedPeople = cleanNewSelected;
      } else {
        // If unchecking ...
        this.selectedPeople = [];
      }

      this.headerChecked = !this.headerChecked;
    }

    this.updateSubmitWarning(this.selectedPeople.length);
  }

  private countSelectable(rows: PersonRow[]) {
    return rows.filter(this.isRowSelectable).length;
  }

  private updateSubmitWarning(peopleCount: number) {
    const actionLabel = this.bulkActions.find((i) => i.id === this.action)
      .label;
    this.submitWarning.message = `
      ${actionLabel}: ${peopleCount} ${this.submitWarning.people}
    `;
  }

  public async applyAction() {
    await this.bulkActionService.applyAction(
      this.action,
      this.programId,
      this.selectedPeople,
    );

    this.resetBulkAction();
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });

    await alert.present();
  }
}
