import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController, ModalController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { BulkAction, BulkActionId } from 'src/app/models/bulk-actions.models';
import {
  PopupPayoutDetails,
  SinglePayoutDetails,
} from 'src/app/models/payment.model';
import { PaStatus, Person, PersonRow } from 'src/app/models/person.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { StatusEnum } from 'src/app/models/status.enum';
import { IntersolvePayoutStatus } from 'src/app/models/transaction-custom-data';
import { Transaction } from 'src/app/models/transaction.model';
import { BulkActionsService } from 'src/app/services/bulk-actions.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { formatPhoneNumber } from 'src/app/shared/format-phone-number';
import { environment } from 'src/environments/environment';
import { PastPaymentsService } from '../../services/past-payments.service';
import { EditPersonAffectedPopupComponent } from '../edit-person-affected-popup/edit-person-affected-popup.component';
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
  public thisPhase: ProgramPhase;
  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public phaseEnum = ProgramPhase;

  public program: Program;
  public activePhase: ProgramPhase;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public isLoading: boolean;

  public columnDefaults: any;
  public columns: any[] = [];
  private columnsAvailable: any[] = [];
  private paymentColumnTemplate: any = {};
  public paymentColumns: any[] = [];
  private pastTransactions: Transaction[] = [];
  private lastPaymentId: number;

  private allPeopleData: Person[];
  public allPeopleAffected: PersonRow[] = [];
  public selectedPeople: PersonRow[] = [];
  public visiblePeopleAffected: PersonRow[] = [];
  public filterRowsVisibleQuery: string;

  public headerChecked = false;
  public headerSelectAllVisible = false;

  public isInProgress = false;
  public paymentInProgress = false;

  public action: BulkActionId = BulkActionId.chooseAction;
  public bulkActions: BulkAction[] = [
    {
      id: BulkActionId.invite,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.invite',
      ),
      roles: [UserRole.PersonalData],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),

        minLength: 20,
      },
    },
    {
      id: BulkActionId.markNoLongerEligible,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.no-longer-eligible',
      ),
      roles: [UserRole.PersonalData],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.selectForValidation,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.select-for-validation',
      ),
      roles: [UserRole.RunProgram],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: false,
    },
    {
      id: BulkActionId.includeRunProgramRole,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.include',
      ),
      roles: [UserRole.RunProgram],
      phases: [ProgramPhase.inclusion],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: false,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        minLength: 20,
      },
    },
    {
      id: BulkActionId.includePersonalDataRole,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.include',
      ),
      roles: [UserRole.PersonalData],
      phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: false,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        minLength: 20,
      },
    },
    {
      id: BulkActionId.reject,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.reject',
      ),
      roles: [UserRole.PersonalData],
      phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: `${this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        )} <br> ${this.translate.instant(
          'page.program.program-people-affected.action-inputs.reject.explanation',
        )}`,
        minLength: 20,
      },
    },
    {
      id: BulkActionId.endInclusion,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.end-inclusion',
      ),
      roles: [UserRole.PersonalData],
      phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        minLength: 20,
      },
    },
    {
      id: BulkActionId.sendMessage,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.send-message',
      ),
      roles: [UserRole.PersonalData],
      phases: [
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.payment,
        ProgramPhase.reviewInclusion,
      ],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),

        minLength: 20,
      },
    },
    {
      id: BulkActionId.deletePa,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.delete-pa',
      ),
      roles: [UserRole.RunProgram, UserRole.PersonalData],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
    },
  ];
  public applyBtnDisabled = true;
  public submitWarning: any;

  public canViewPersonalData: boolean;

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    private bulkActionService: BulkActionsService,
    private pastPaymentsService: PastPaymentsService,
    private alertController: AlertController,
    public modalController: ModalController,
    public platform: Platform,
    private pubSub: PubSubService,
    private router: Router,
  ) {
    this.locale = environment.defaultLocale;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.refreshData();
      }
    });

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
      comparator: undefined,
      frozenLeft: false,
      phases: [
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.reviewInclusion,
        ProgramPhase.payment,
      ],
      roles: [UserRole.View, UserRole.RunProgram, UserRole.PersonalData],
      showIfNoValidation: true,
      headerClass: 'ion-text-wrap ion-align-self-end',
    };
    const columnDateTimeWidth = 142;
    const columnScoreWidth = 90;
    const columnPhoneNumberWidth = 130;

    this.columnsAvailable = [
      {
        prop: 'name',
        name: this.translate.instant(
          'page.program.program-people-affected.column.name',
        ),
        ...this.columnDefaults,
        frozenLeft: this.platform.width() > 768,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        roles: [UserRole.View, UserRole.PersonalData],
      },
      {
        prop: 'phoneNumber',
        name: this.translate.instant(
          'page.program.program-people-affected.column.phone-number',
        ),
        ...this.columnDefaults,
        frozenLeft: this.platform.width() > 1280,
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ],
        roles: [UserRole.View, UserRole.PersonalData],
        minWidth: columnPhoneNumberWidth,
      },
      {
        prop: 'namePartnerOrganization',
        name: this.translate.instant(
          'page.program.program-people-affected.column.namePartnerOrganization',
        ),
        ...this.columnDefaults,
        frozenLeft: this.platform.width() > 1280,
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ],
        roles: [UserRole.View, UserRole.PersonalData, UserRole.RunProgram],
      },
      {
        prop: 'statusLabel',
        name: this.translate.instant(
          'page.program.program-people-affected.column.status',
        ),
        ...this.columnDefaults,
        width: 135,
        frozenLeft: this.platform.width() > 1280,
      },
      {
        prop: 'imported',
        name: this.translate.instant(
          'page.program.program-people-affected.column.imported',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateTimeWidth,
      },
      {
        prop: 'invited',
        name: this.translate.instant(
          'page.program.program-people-affected.column.invited',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateTimeWidth,
      },
      {
        prop: 'markedNoLongerEligible',
        name: this.translate.instant(
          'page.program.program-people-affected.column.no-longer-eligible',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        width: columnDateTimeWidth,
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
        prop: 'inclusionScore',
        name: this.translate.instant(
          'page.program.program-people-affected.column.inclusion-score',
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
        prop: 'rejected',
        name: this.translate.instant(
          'page.program.program-people-affected.column.rejected',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'inclusionEnded',
        name: this.translate.instant(
          'page.program.program-people-affected.column.inclusion-ended',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.reviewInclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'paymentAmountMultiplier',
        name: this.translate.instant(
          'page.program.program-people-affected.column.paymentAmountMultiplier',
        ),
        ...this.columnDefaults,
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.reviewInclusion,
          ProgramPhase.payment,
        ],
        width: columnScoreWidth,
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
      paymentIndex: 0,
      ...this.columnDefaults,
      phases: [ProgramPhase.payment],
      width: columnDateTimeWidth,
    };
  }

  async ngOnInit() {
    this.isLoading = true;

    this.program = await this.programsService.getProgramById(this.programId);
    this.activePhase = this.program.phase;

    this.paymentInProgress =
      await this.pastPaymentsService.checkPaymentInProgress(this.program.id);

    this.canViewPersonalData = this.authService.hasUserRole([
      UserRole.View,
      UserRole.PersonalData,
    ]);

    this.loadColumns();

    this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
      this.programId,
    );
    const firstPaymentToShow = 1;

    if (this.thisPhase === ProgramPhase.payment) {
      this.pastTransactions = await this.programsService.getTransactions(
        this.programId,
        firstPaymentToShow,
      );
      this.addPaymentColumns(firstPaymentToShow);
    }

    await this.loadData();

    this.isLoading = false;

    this.updateBulkActions();

    // Timeout to make sure the datatable elements are rendered/generated:
    window.setTimeout(() => {
      this.setupProxyScrollbar();
    }, 1000);

    // Listen for external signals to refresh data shown in table:
    this.pubSub.subscribe(PubSubEvent.dataRegistrationChanged, () => {
      this.refreshData();
    });
  }

  private setupProxyScrollbar() {
    const proxyScrollbar: HTMLElement =
      document.querySelector('.proxy-scrollbar');
    const proxyScrollbarContent: HTMLElement = proxyScrollbar.querySelector(
      '.proxy-scrollbar--content',
    );

    if (
      !proxyScrollbar.dataset.target ||
      !proxyScrollbar.dataset.targetContent
    ) {
      return;
    }

    const targetScrollArea: HTMLElement = document.querySelector(
      proxyScrollbar.dataset.target,
    );
    const targetScrollContent: HTMLElement = document.querySelector(
      proxyScrollbar.dataset.targetContent,
    );

    if (!targetScrollArea || !targetScrollContent) {
      return;
    }

    // Link scroll-events of proxy and target-elements:
    proxyScrollbar.addEventListener('scroll', () => {
      targetScrollArea.scrollLeft = proxyScrollbar.scrollLeft;
    });
    targetScrollArea.addEventListener('scroll', () => {
      proxyScrollbar.scrollLeft = targetScrollArea.scrollLeft;
    });

    // Set size of proxy-content:
    proxyScrollbarContent.style.width = targetScrollContent.style.width;
  }

  private loadColumns() {
    this.columns = [];
    for (const column of this.columnsAvailable) {
      if (
        column.phases.includes(this.thisPhase) &&
        this.authService.hasUserRole(column.roles) &&
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
    column.paymentIndex = index;
    return column;
  }

  private async addPaymentColumns(firstPaymentToShow) {
    const nrOfPayments = this.program.distributionDuration;

    const lastPaymentToShow = Math.min(this.lastPaymentId + 1, nrOfPayments);

    for (let index = firstPaymentToShow; index <= lastPaymentToShow; index++) {
      const column = this.createPaymentColumn(index);

      this.paymentColumns.push(column);
    }
  }

  private updateBulkActions() {
    this.bulkActions = this.bulkActions.map((action) => {
      action.enabled =
        this.authService.hasUserRole(action.roles) &&
        // action.phases.includes(this.activePhase) &&
        action.phases.includes(this.thisPhase) &&
        this.checkValidationColumnOrAction(action);
      return action;
    });
  }

  public hasEnabledActions(): boolean {
    const enabledActions = this.bulkActions.filter((a) => a.enabled);
    return enabledActions.length > 0;
  }

  private async loadData() {
    if (this.canViewPersonalData) {
      this.allPeopleData = await this.programsService.getPeopleAffectedPrivacy(
        this.programId,
      );
    } else {
      this.allPeopleData = await this.programsService.getPeopleAffected(
        this.programId,
      );
    }
    this.allPeopleAffected = this.createTableData(this.allPeopleData);
    this.visiblePeopleAffected = [...this.allPeopleAffected];
  }

  private createTableData(source: Person[]): PersonRow[] {
    if (!source || source.length === 0) {
      return [];
    }
    return source
      .sort(this.sortPeopleByInclusionScore)
      .map((person) => this.createPersonRow(person));
  }

  private sortPeopleByInclusionScore(a: Person, b: Person) {
    if (a.inclusionScore === b.inclusionScore) {
      return a.startedRegistrationDate > b.startedRegistrationDate ? -1 : 1;
    } else {
      return a.inclusionScore > b.inclusionScore ? -1 : 1;
    }
  }

  private createPersonRow(person: Person): PersonRow {
    let personRow: PersonRow = {
      referenceId: person.referenceId,
      checkboxVisible: false,
      pa: `PA #${String(person.id)}`,
      status: person.status,
      statusLabel: this.translate.instant(
        'page.program.program-people-affected.status.' + person.status,
      ),
      imported: person.importedDate
        ? formatDate(person.importedDate, this.dateFormat, this.locale)
        : null,
      invited: person.invitedDate
        ? formatDate(person.invitedDate, this.dateFormat, this.locale)
        : null,
      markedNoLongerEligible: person.noLongerEligibleDate
        ? formatDate(person.noLongerEligibleDate, this.dateFormat, this.locale)
        : null,
      digitalIdCreated: person.startedRegistrationDate
        ? formatDate(
            person.startedRegistrationDate,
            this.dateFormat,
            this.locale,
          )
        : null,
      vulnerabilityAssessmentCompleted: person.registeredDate
        ? formatDate(person.registeredDate, this.dateFormat, this.locale)
        : null,
      inclusionScore: person.inclusionScore,
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
      included: person.inclusionDate
        ? formatDate(person.inclusionDate, this.dateFormat, this.locale)
        : null,
      rejected:
        person.rejectionDate && person.status === PaStatus.rejected
          ? formatDate(person.rejectionDate, this.dateFormat, this.locale)
          : null,
      inclusionEnded:
        person.inclusionEndDate && person.status === PaStatus.inclusionEnded
          ? formatDate(person.inclusionEndDate, this.dateFormat, this.locale)
          : null,
      name: person.name,
      namePartnerOrganization: person.namePartnerOrganization,
      phoneNumber: formatPhoneNumber(person.phoneNumber),
      whatsappPhoneNumber: formatPhoneNumber(person.whatsappPhoneNumber),
      vnumber: person.vnumber,
      paymentAmountMultiplier: person.paymentAmountMultiplier
        ? `${person.paymentAmountMultiplier}&times;`
        : '',
      fsp: person.fsp,
      hasNote: !!person.hasNote,
    };

    personRow = this.fillPaymentColumns(personRow);
    return personRow;
  }

  private getTransactionOfPaymentForRegistration(
    paymentIndex: number,
    referenceId: string,
  ) {
    return this.pastTransactions.find(
      (transaction) =>
        transaction.payment === paymentIndex &&
        transaction.referenceId === referenceId,
    );
  }

  private fillPaymentColumns(personRow: PersonRow): PersonRow {
    this.paymentColumns.forEach((paymentColumn) => {
      const transaction = this.getTransactionOfPaymentForRegistration(
        paymentColumn.paymentIndex,
        personRow.referenceId,
      );

      if (!transaction) {
        return;
      }

      let paymentColumnText;

      if (transaction.status === StatusEnum.success) {
        paymentColumnText = formatDate(
          transaction.paymentDate,
          this.dateFormat,
          this.locale,
        );
      } else if (transaction.status === StatusEnum.waiting) {
        personRow['payment' + paymentColumn.paymentIndex + '-error'] =
          this.translate.instant(
            'page.program.program-people-affected.transaction.waiting-message',
          );
        personRow['payment' + paymentColumn.paymentIndex + '-waiting'] = true;
        paymentColumnText = this.translate.instant(
          'page.program.program-people-affected.transaction.waiting',
        );
      } else {
        personRow['payment' + paymentColumn.paymentIndex + '-error'] =
          transaction.error;
        personRow['payment' + paymentColumn.paymentIndex + '-amount'] =
          transaction.amount;
        paymentColumnText = this.translate.instant(
          'page.program.program-people-affected.transaction.failed',
        );
      }

      const paymentColumnValue = {
        text: paymentColumnText,
        hasMessageIcon: this.enableMessageSentIcon(transaction),
        hasMoneyIconTable: this.enableMoneySentIconTable(transaction),
      };
      personRow['payment' + paymentColumn.paymentIndex] = paymentColumnValue;
    });
    return personRow;
  }

  public enableMessageSentIcon(transaction: any) {
    if (
      transaction.customData &&
      [
        IntersolvePayoutStatus.initialMessage,
        IntersolvePayoutStatus.voucherSent,
      ].includes(transaction.customData.IntersolvePayoutStatus)
    ) {
      return true;
    }
    return false;
  }

  public enableMoneySentIconTable(transaction: any) {
    if (
      (!transaction.customData.IntersolvePayoutStatus ||
        transaction.customData.IntersolvePayoutStatus ===
          IntersolvePayoutStatus.voucherSent) &&
      transaction.status === StatusEnum.success
    ) {
      return true;
    }
    return false;
  }

  public hasVoucherSupport(fsp: string) {
    const voucherFsps = ['Intersolve-no-whatsapp', 'Intersolve-whatsapp'];
    return voucherFsps.includes(fsp);
  }

  public showWhatsappNumber() {
    let show = false;
    for (const pa of this.allPeopleAffected) {
      show = this.hasVoucherSupport(pa.fsp);
      if (show) {
        break;
      }
    }
    return show;
  }

  public showVnumber() {
    let show = false;
    for (const pa of this.allPeopleAffected) {
      show = !!pa.vnumber;
      if (show) {
        break;
      }
    }
    return show;
  }

  public hasError(row: PersonRow, paymentIndex: number) {
    return !!row['payment' + paymentIndex + '-error'];
  }

  public hasWaiting(row: PersonRow, paymentIndex: number) {
    return !!row['payment' + paymentIndex + '-waiting'];
  }

  public async editPersonAffectedPopup(row: PersonRow, programId: number) {
    const person = this.allPeopleData.find(
      (pa) => pa.referenceId === row.referenceId,
    );
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: EditPersonAffectedPopupComponent,
      componentProps: {
        person,
        programId,
      },
    });

    await modal.present();
  }

  public async statusPopup(row: PersonRow, column, value) {
    const isSinglePayment = this.enableSinglePayment(row, column);
    const hasError = this.hasError(row, column.paymentIndex);
    const hasWaiting = this.hasWaiting(row, column.paymentIndex);

    const content = hasWaiting
      ? row[column.prop + '-error']
      : hasError
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.error-message',
        ) +
        ': <strong>' +
        row[column.prop + '-error'] +
        '</strong><br><br>' +
        this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.fix-error',
        )
      : isSinglePayment
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.single-payment.intro',
        )
      : null;
    const contentNotes = hasWaiting
      ? null
      : hasError
      ? this.translate.instant(
          'page.program.program-people-affected.payment-status-popup.notes',
        )
      : null;
    const showRetryButton = hasWaiting ? false : hasError ? true : false;
    const payoutDetails: PopupPayoutDetails =
      hasError || value.hasMessageIcon || value.hasMoneyIconTable
        ? {
            programId: this.programId,
            payment: column.paymentIndex,
            amount: row[column.prop + '-amount'],
            referenceId: row.referenceId,
            currency: this.program.currency,
          }
        : null;
    const singlePayoutDetails: SinglePayoutDetails = isSinglePayment
      ? {
          paNr: row.pa,
          amount: this.program.fixedTransferValue,
          currency: this.program.currency,
          multiplier: row.paymentAmountMultiplier
            ? Number(row.paymentAmountMultiplier.substr(0, 1))
            : 1,
          programId: this.programId,
          payment: column.paymentIndex,
          referenceId: row.referenceId,
        }
      : null;
    let voucherUrl = null;
    let voucherButtons = null;

    if (this.hasVoucherSupport(row.fsp) && !hasError && !!value) {
      const voucherBlob = await this.programsService.exportVoucher(
        row.referenceId,
        column.paymentIndex,
      );
      voucherUrl = window.URL.createObjectURL(voucherBlob);
      voucherButtons = true;
    }

    const titleError = hasError ? `${column.name}: ${value.text}` : null;
    const titleMessageIcon = value.hasMessageIcon ? `${column.name}: ` : null;
    const titleMoneyIcon = value.hasMoneyIconTable ? `${column.name}: ` : null;
    const titleSinglePayment = isSinglePayment ? column.name : null;

    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentStatusPopupComponent,
      componentProps: {
        titleMessageIcon,
        titleMoneyIcon,
        titleError,
        titleSinglePayment,
        content,
        contentNotes,
        showRetryButton,
        payoutDetails,
        singlePayoutDetails,
        voucherButtons,
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
    this.resetFilterRowsVisible();
  }

  private toggleHeaderCheckbox() {
    if (this.countSelectable(this.allPeopleAffected) < 1) {
      this.headerSelectAllVisible = false;
      return;
    }
    this.headerSelectAllVisible = !this.headerSelectAllVisible;
  }

  public isRowSelectable(row: PersonRow): boolean {
    return row.checkboxVisible || false;
  }

  public enableSinglePayment(row: PersonRow, column): boolean {
    const included = row.status === PaStatus.included;
    const noPaymentDone = !row[column.prop];
    const noFuturePayment = column.paymentIndex <= this.lastPaymentId;
    const onlyLast3Payments = column.paymentIndex > this.lastPaymentId - 3;
    const noPaymentInProgress = !this.paymentInProgress;
    return (
      included &&
      noPaymentDone &&
      noFuturePayment &&
      onlyLast3Payments &&
      noPaymentInProgress
    );
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
    if (!this.getCurrentBulkAction()) {
      return;
    }
    const actionLabel = this.getCurrentBulkAction().label;
    this.submitWarning.message = `
      ${actionLabel}: ${peopleCount} ${this.submitWarning.people}
    `;
  }

  public async applyAction(confirmInput?: string) {
    this.isInProgress = true;
    await this.bulkActionService.applyAction(
      this.action,
      this.programId,
      this.selectedPeople,
      confirmInput,
    );
    this.isInProgress = false;

    this.resetBulkAction();
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });

    await alert.present();
  }

  private resetFilterRowsVisible() {
    this.filterRowsVisibleQuery = '';
  }

  public filterRowsVisible(value: string) {
    const filterVal = value.toLowerCase().trim();
    const rowsVisible = this.allPeopleAffected.filter((row: PersonRow) => {
      // Loop over all columns
      for (const key of Object.keys(row)) {
        try {
          const columnValue = row[key].toLowerCase();
          const includeRow =
            columnValue.indexOf(filterVal) !== -1 || // check literal values
            columnValue.replace(/\s/g, '').indexOf(filterVal) !== -1 || // check also with spaces removed
            !filterVal;
          if (includeRow) {
            return includeRow;
          }
        } catch {
          // Do not filter on unfilterable column types
        }
      }
    });

    this.visiblePeopleAffected = rowsVisible;
  }

  public paComparator(a: string, b: string) {
    // Use numeric sorting for 'text'-values, so the order will be: "PA #1" < "PA #2" < "PA #10"
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  public async refreshData() {
    this.isLoading = true;
    await this.loadData();
    this.isLoading = false;
  }
}
