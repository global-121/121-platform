import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { BulkAction, BulkActionId } from 'src/app/models/bulk-actions.models';
import { Person, PersonRow } from 'src/app/models/person.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { BulkActionsService } from 'src/app/services/bulk-actions.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { formatPhoneNumber } from 'src/app/shared/format-phone-number';
import { environment } from 'src/environments/environment';
import { PaymentErrorPopupComponent } from '../payment-error-popup/payment-error-popup.component';

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
  private columnsAvailable: any[] = [];
  private paymentColumnTemplate: any = {};
  public paymentColumns: any[] = [];
  private pastTransactions: any[] = [];

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
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.selectForValidation,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.select-for-validation',
      ),
      roles: [UserRole.ProjectOfficer],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: false,
    },
    {
      id: BulkActionId.includeProjectOfficer,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.include',
      ),
      roles: [UserRole.ProjectOfficer],
      phases: [ProgramPhase.inclusion],
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.includeProgramManager,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.include',
      ),
      roles: [UserRole.ProgramManager],
      phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.reject,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.reject',
      ),
      roles: [UserRole.ProgramManager],
      phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
      showIfNoValidation: true,
    },
  ];

  public submitWarning: any;

  constructor(
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    private bulkActionService: BulkActionsService,
    private alertController: AlertController,
    public modalController: ModalController,
  ) {
    this.locale = environment.defaultLocale;

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
      phases: [
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.reviewInclusion,
        ProgramPhase.payment,
      ],
      roles: [UserRole.ProjectOfficer, UserRole.ProgramManager],
      showIfNoValidation: true,
      headerClass: 'ion-text-wrap ion-align-self-end',
    };
    const columnDateTimeWidth = 142;
    const columnDateWidth = 100;
    const columnScoreWidth = 90;
    const columnPhoneNumberWidth = 130;
    this.columnsAvailable = [
      {
        prop: 'pa',
        name: this.translate.instant(
          'page.program.program-people-affected.column.person',
        ),
        ...columnDefaults,
        width: 85,
      },
      {
        prop: 'name',
        name: this.translate.instant(
          'page.program.program-people-affected.column.name',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        roles: [UserRole.ProgramManager],
      },
      {
        prop: 'phoneNumber',
        name: this.translate.instant(
          'page.program.program-people-affected.column.phone-number',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        roles: [UserRole.ProgramManager],
        minWidth: columnPhoneNumberWidth,
      },
      {
        prop: 'vnumber',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vnumber',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        roles: [UserRole.ProgramManager],
        minWidth: columnPhoneNumberWidth,
      },
      {
        prop: 'statusLabel',
        name: this.translate.instant(
          'page.program.program-people-affected.column.status',
        ),
        ...columnDefaults,
        width: 90,
      },
      {
        prop: 'digitalIdCreated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.digital-id-created',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateTimeWidth,
      },
      {
        prop: 'vulnerabilityAssessmentCompleted',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-completed',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateTimeWidth,
      },
      {
        prop: 'tempScore',
        name: this.translate.instant(
          'page.program.program-people-affected.column.temp-score',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        showIfNoValidation: false,
        width: columnScoreWidth,
      },
      {
        prop: 'selectedForValidation',
        name: this.translate.instant(
          'page.program.program-people-affected.column.selected-for-validation',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        showIfNoValidation: false,
        width: columnDateTimeWidth,
      },
      {
        prop: 'vulnerabilityAssessmentValidated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-validated',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        showIfNoValidation: false,
        width: columnDateTimeWidth,
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
        phases: [
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ],
        width: columnDateTimeWidth,
      },
      {
        prop: 'rejected',
        name: this.translate.instant(
          'page.program.program-people-affected.column.rejected',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'fsp',
        name: this.translate.instant(
          'page.program.program-people-affected.column.fsp',
        ),
        ...columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
    ];
    this.paymentColumnTemplate = {
      prop: 'payment',
      name: this.translate.instant(
        'page.program.program-people-affected.column.payment',
      ),
      ...columnDefaults,
      phases: [ProgramPhase.payment],
      width: columnDateTimeWidth,
    };

    this.loadColumns();
  }

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);
    this.activePhase = this.program.state;

    this.loadColumns();
    if (this.thisPhase === ProgramPhase.payment) {
      this.addPaymentColumns();
      this.pastTransactions = await this.programsService.getTransactions(
        this.programId,
      );
    }

    await this.loadData();

    this.updateBulkActions();
  }

  private loadColumns() {
    this.columns = [];
    for (const column of this.columnsAvailable) {
      if (
        column.phases.includes(this.thisPhase) &&
        column.roles.includes(this.userRole) &&
        this.checkValidationColumnOrAction(column)
      ) {
        this.columns.push(column);
      }
    }
  }

  private checkValidationColumnOrAction(columnOrAction) {
    return (
      (columnOrAction.showIfNoValidation && !this.program.validation) ||
      this.program.validation
    );
  }

  private addPaymentColumns() {
    const nrOfInstallments = this.program.distributionDuration;

    for (let p = 0; p < nrOfInstallments; p++) {
      const column = JSON.parse(JSON.stringify(this.paymentColumnTemplate)); // Hack to clone without reference
      column.prop += p + 1;
      column.name += p + 1;
      this.paymentColumns.push(column);
    }
  }

  private updateBulkActions() {
    this.bulkActions = this.bulkActions.map((action) => {
      action.enabled =
        action.roles.includes(this.userRole) &&
        action.phases.includes(this.activePhase) &&
        action.phases.includes(this.thisPhase) &&
        this.checkValidationColumnOrAction(action);
      return action;
    });
    this.toggleChooseActionNoActions(this.bulkActions);
  }

  private toggleChooseActionNoActions(bulkActions: BulkAction[]) {
    const defaultAction = bulkActions.find(
      (a) => a.id === BulkActionId.chooseAction,
    );

    if (this.nrEnabledActions(bulkActions) === 1) {
      defaultAction.label = this.translate.instant(
        'page.program.program-people-affected.no-actions',
      );
    } else {
      defaultAction.label = this.translate.instant(
        'page.program.program-people-affected.choose-action',
      );
    }
  }

  private nrEnabledActions(bulkActions: BulkAction[]) {
    const enabledActions = bulkActions.filter((a) => a.enabled);
    return enabledActions.length;
  }

  private async loadData() {
    let allPeopleData: Person[];
    if (this.userRole === UserRole.ProgramManager) {
      allPeopleData = await this.programsService.getPeopleAffectedPrivacy(
        this.programId,
      );
    } else {
      allPeopleData = await this.programsService.getPeopleAffected(
        this.programId,
      );
    }
    this.allPeopleAffected = this.createTableData(allPeopleData);
  }

  private createTableData(source: Person[]): PersonRow[] {
    if (!source || source.length === 0) {
      return [];
    }
    return source
      .sort(this.sortPeopleByTempScore)
      .map((person, index) => this.createPersonRow(person, index + 1));
  }

  private sortPeopleByTempScore(a: Person, b: Person) {
    if (a.tempScore === b.tempScore) {
      return a.created > b.created ? -1 : 1;
    } else {
      return a.tempScore > b.tempScore ? -1 : 1;
    }
  }

  private createPersonRow(person: Person, index: number): PersonRow {
    let personRow: PersonRow = {
      did: person.did,
      checkboxVisible: false,
      pa: `PA #${index}`,
      status: person.status,
      statusLabel: this.translate.instant(
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
      rejected: person.rejectionDate
        ? formatDate(person.rejectionDate, this.dateFormat, this.locale)
        : null,
      name: person.name,
      phoneNumber: formatPhoneNumber(person.phoneNumber),
      vnumber: person.vnumber,
      fsp: person.fsp,
    };

    personRow = this.fillPaymentColumns(personRow);

    return personRow;
  }

  private fillPaymentColumns(personRow: PersonRow): PersonRow {
    this.paymentColumns.map((_, index) => {
      const transactionsThisInstallment = this.pastTransactions.filter(
        (i) => i.installment === index + 1 && i.did === personRow.did,
      );

      if (transactionsThisInstallment.length) {
        const transaction = transactionsThisInstallment[0];
        if (transaction.status === 'success') {
          personRow['payment' + (index + 1)] = formatDate(
            transaction.installmentdate,
            this.dateFormat,
            this.locale,
          );
        } else if (transaction.status === 'waiting') {
          personRow['payment' + (index + 1)] = this.translate.instant(
            'page.program.program-people-affected.waiting',
          )
        } else {
          (personRow['payment' + (index + 1)] = this.translate.instant(
            'page.program.program-people-affected.failed',
          )),
            (personRow['payment' + (index + 1) + '-error'] = transaction.error);
        }
      }
    });
    return personRow;
  }

  public async errorPopup(row, column) {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentErrorPopupComponent,
      componentProps: {
        column: column.name,
        error: row[column.prop + '-error'],
      },
    });

    await modal.present();
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
    // This extra hack for 'de-select all' to work properly
    if (
      this.headerChecked &&
      newSelected.length === this.allPeopleAffected.length
    ) {
      newSelected = [];
    }

    const allSelectable = this.allPeopleAffected.filter(this.isRowSelectable);
    const prevSelectedCount = this.selectedPeople.length;
    const cleanNewSelected = newSelected.filter(this.isRowSelectable);

    // We need to distinguish between the header-select case and the single-row-selection, as they both call the same function
    const diffNewSelected = Math.abs(
      cleanNewSelected.length - prevSelectedCount,
    );
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
