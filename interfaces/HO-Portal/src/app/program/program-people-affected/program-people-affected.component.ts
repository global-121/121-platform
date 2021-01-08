import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { BulkAction, BulkActionId } from 'src/app/models/bulk-actions.models';
import { RetryPayoutDetails } from 'src/app/models/installment.model';
import { Person, PersonRow } from 'src/app/models/person.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { BulkActionsService } from 'src/app/services/bulk-actions.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { formatPhoneNumber } from 'src/app/shared/format-phone-number';
import { environment } from 'src/environments/environment';
import { PaymentStatusPopupComponent } from '../payment-status-popup/payment-status-popup.component';

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

  public phaseEnum = ProgramPhase;
  public userEnum = UserRole;

  public program: Program;
  public activePhase: ProgramPhase;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public columnDefaults: any;
  public columns: any[] = [];
  private columnsAvailable: any[] = [];
  private paymentColumnTemplate: any = {};
  public paymentColumns: any[] = [];
  private pastTransactions: any[] = [];

  public allPeopleAffected: PersonRow[] = [];
  public selectedPeople: PersonRow[] = [];

  public headerChecked = false;
  public headerSelectAllVisible = false;

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
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.reject-checkbox',
        ),
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.reject-explanation',
        ),
        minLength: 20,
      },
    },
    {
      id: BulkActionId.notifyIncluded,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.notify-included',
      ),
      roles: [UserRole.ProjectOfficer],
      phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
      showIfNoValidation: true,
    },
  ];
  public applyBtnDisabled = true;
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

    this.columnDefaults = {
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
    const columnScoreWidth = 90;
    const columnPhoneNumberWidth = 130;

    this.columnsAvailable = [
      {
        prop: 'pa',
        name: this.translate.instant(
          'page.program.program-people-affected.column.person',
        ),
        ...this.columnDefaults,
        width: 85,
      },
      {
        prop: 'name',
        name: this.translate.instant(
          'page.program.program-people-affected.column.name',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        roles: [UserRole.ProgramManager],
      },
      {
        prop: 'phoneNumber',
        name: this.translate.instant(
          'page.program.program-people-affected.column.phone-number',
        ),
        ...this.columnDefaults,
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ],
        roles: [UserRole.ProgramManager],
        minWidth: columnPhoneNumberWidth,
      },
      {
        prop: 'statusLabel',
        name: this.translate.instant(
          'page.program.program-people-affected.column.status',
        ),
        ...this.columnDefaults,
        width: 90,
      },
      {
        prop: 'digitalIdCreated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.digital-id-created',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateTimeWidth,
      },
      {
        prop: 'vulnerabilityAssessmentCompleted',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-completed',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateTimeWidth,
      },
      {
        prop: 'tempScore',
        name: this.translate.instant(
          'page.program.program-people-affected.column.temp-score',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        showIfNoValidation: false,
        width: columnScoreWidth,
      },
      {
        prop: 'selectedForValidation',
        name: this.translate.instant(
          'page.program.program-people-affected.column.selected-for-validation',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        showIfNoValidation: false,
        width: columnDateTimeWidth,
      },
      {
        prop: 'vulnerabilityAssessmentValidated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-validated',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        showIfNoValidation: false,
        width: columnDateTimeWidth,
      },
      {
        prop: 'finalScore',
        name: this.translate.instant(
          'page.program.program-people-affected.column.final-score',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        width: columnScoreWidth,
      },
      {
        prop: 'included',
        name: this.translate.instant(
          'page.program.program-people-affected.column.included',
        ),
        ...this.columnDefaults,
        phases: [
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ],
        width: columnDateTimeWidth,
      },
      {
        prop: 'notifiedOfInclusion',
        name: this.translate.instant(
          'page.program.program-people-affected.column.notified-of-inclusion',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'rejected',
        name: this.translate.instant(
          'page.program.program-people-affected.column.rejected',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'fsp',
        name: this.translate.instant(
          'page.program.program-people-affected.column.fsp',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        width: 150,
      },
    ];
    this.paymentColumnTemplate = {
      prop: 'payment',
      name: this.translate.instant(
        'page.program.program-people-affected.column.payment',
      ),
      installmentIndex: 0,
      ...this.columnDefaults,
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
      this.pastTransactions = await this.programsService.getTransactions(
        this.programId,
      );
      this.addPaymentColumns();
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

  private createPaymentColumn(index: number) {
    const column = JSON.parse(JSON.stringify(this.paymentColumnTemplate)); // Hack to clone without reference;
    column.name += index;
    column.prop += index;
    column.installmentIndex = index;
    return column;
  }

  private addPaymentColumns() {
    const nrOfInstallments = this.program.distributionDuration;

    for (let index = 1; index <= nrOfInstallments; index++) {
      const column = this.createPaymentColumn(index);
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
      notifiedOfInclusion: person.inclusionNotificationDate
        ? formatDate(
            person.inclusionNotificationDate,
            this.dateFormat,
            this.locale,
          )
        : null,
      name: person.name,
      phoneNumber: formatPhoneNumber(person.phoneNumber),
      whatsappPhoneNumber: formatPhoneNumber(person.whatsappPhoneNumber),
      vnumber: person.vnumber,
      fsp: person.fsp,
    };

    personRow = this.fillPaymentColumns(personRow);

    return personRow;
  }

  private getTransactionOfInstallmentForDid(
    installmentIndex: number,
    did: string,
  ) {
    return this.pastTransactions.find(
      (transaction) =>
        transaction.installment === installmentIndex && transaction.did === did,
    );
  }

  private fillPaymentColumns(personRow: PersonRow): PersonRow {
    this.paymentColumns.forEach((paymentColumn) => {
      const transaction = this.getTransactionOfInstallmentForDid(
        paymentColumn.installmentIndex,
        personRow.did,
      );

      if (!transaction) {
        return;
      }

      let paymentColumnText;

      if (transaction.status === 'success') {
        paymentColumnText = formatDate(
          transaction.installmentDate,
          this.dateFormat,
          this.locale,
        );
      } else if (transaction.status === 'waiting') {
        paymentColumnText = this.translate.instant(
          'page.program.program-people-affected.transaction.waiting',
        );
      } else {
        personRow['payment' + paymentColumn.installmentIndex + '-error'] =
          transaction.error;
        personRow['payment' + paymentColumn.installmentIndex + '-amount'] =
          transaction.amount;
        paymentColumnText = this.translate.instant(
          'page.program.program-people-affected.transaction.failed',
        );
      }

      const paymentColumnValue = {
        text: paymentColumnText,
        hasMessageIcon: this.enableMessageSentIcon(transaction),
        hasMoneyIcon: this.enableMoneySentIcon(transaction),
      };
      console.log('paymentColumnValue: ', paymentColumnValue);
      personRow[
        'payment' + paymentColumn.installmentIndex
      ] = paymentColumnValue;
    });
    return personRow;
  }

  public enableMessageSentIcon(transaction: any) {
    if (
      transaction.customData &&
      ['InitialMessage', 'VoucherSent'].includes(
        transaction.customData.IntersolvePayoutStatus,
      )
    ) {
      return true;
    }
    return false;
  }

  public enableMoneySentIcon(transaction: any) {
    if (
      !transaction.customData.IntersolvePayoutStatus ||
      transaction.customData.IntersolvePayoutStatus === 'VoucherSent'
    ) {
      return true;
    }
    return false;
  }

  public hasVoucherSupport(fsp: string) {
    const voucherFsps = ['Intersolve-no-whatsapp', 'Intersolve-whatsapp'];
    return voucherFsps.includes(fsp);
  }

  public hasError(row: PersonRow, installmentIndex: number) {
    return !!row['payment' + installmentIndex + '-error'];
  }

  public async statusPopup(row: PersonRow, column, value) {
    console.log('value in status popup: ', value);
    const hasError = this.hasError(row, column.installmentIndex);
    const content = hasError
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.error-message',
        ) +
        ': <strong>' +
        row[column.prop + '-error'] +
        '</strong><br><br>' +
        this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.fix-error',
        )
      : null;
    const contentNotes = hasError
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.notes',
        )
      : null;
    const retryButton = hasError ? true : false;
    const payoutDetails: RetryPayoutDetails = (hasError || value.hasMessageIcon)
      ? {
          programId: this.programId,
          installment: column.installmentIndex,
          amount: row[column.prop + '-amount'],
          did: row.did,
        }
      : null;
    let voucherUrl = null;

    if (this.hasVoucherSupport(row.fsp) && !hasError && !!value) {
      const voucherBlob = await this.programsService.exportVoucher(
        row.did,
        column.installmentIndex,
      );
      voucherUrl = window.URL.createObjectURL(voucherBlob);
    }

    const titleError = hasError ? `${column.name}: ${value.text}` : null;
    const titleMessageIcon = value.hasMessageIcon ? `${column.name}: ` : null;
    const titleMoneyIcon = value.hasMoneyIcon ? `${column.name}: ${value.text}` : null;

    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentStatusPopupComponent,
      componentProps: {
        titleMessageIcon,
        titleMoneyIcon,
        titleError,
        content,
        contentNotes,
        retryButton,
        payoutDetails,
        imageUrl: voucherUrl,
      },
    });
    modal.onDidDismiss().then(() => {
      // Remove the image from browser memory
      if (voucherUrl) {
        window.URL.revokeObjectURL(voucherUrl);
      }
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

  public getCurrentBulkAction(): BulkAction {
    return this.bulkActions.find((i: BulkAction) => i.id === this.action);
  }

  private updateSubmitWarning(peopleCount: number) {
    const actionLabel = this.getCurrentBulkAction().label;
    this.submitWarning.message = `
      ${actionLabel}: ${peopleCount} ${this.submitWarning.people}
    `;
  }

  public async applyAction(confirmInput?: string) {
    await this.bulkActionService.applyAction(
      this.action,
      this.programId,
      this.selectedPeople,
      confirmInput,
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
