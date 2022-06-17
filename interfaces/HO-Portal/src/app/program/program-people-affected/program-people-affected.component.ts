import { formatDate } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController, ModalController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { BulkAction, BulkActionId } from 'src/app/models/bulk-actions.models';
import {
  PaymentColumn,
  PaymentColumnDetail,
} from 'src/app/models/payment.model';
import {
  PaStatus,
  Person,
  PersonRow,
  PersonTableColumn,
} from 'src/app/models/person.model';
import {
  PaTableAttribute,
  Program,
  ProgramPhase,
} from 'src/app/models/program.model';
import { StatusEnum } from 'src/app/models/status.enum';
import { IntersolvePayoutStatus } from 'src/app/models/transaction-custom-data';
import { Transaction } from 'src/app/models/transaction.model';
import { BulkActionsService } from 'src/app/services/bulk-actions.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { formatPhoneNumber } from 'src/app/shared/format-phone-number';
import { environment } from 'src/environments/environment';
import { PastPaymentsService } from '../../services/past-payments.service';
import { SubmitPaymentProps } from '../../shared/confirm-prompt/confirm-prompt.component';
import { EditPersonAffectedPopupComponent } from '../edit-person-affected-popup/edit-person-affected-popup.component';
import { PaymentHistoryPopupComponent } from '../payment-history-popup/payment-history-popup.component';

@Component({
  selector: 'app-program-people-affected',
  templateUrl: './program-people-affected.component.html',
  styleUrls: ['./program-people-affected.component.scss'],
})
export class ProgramPeopleAffectedComponent implements OnInit, OnDestroy {
  @ViewChild('proxyScrollbar')
  private proxyScrollbar: ElementRef;

  @Input()
  public programId: number;
  @Input()
  public thisPhase: ProgramPhase;
  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public phaseEnum = ProgramPhase;

  public program: Program;
  private paTableAttributes: PaTableAttribute[];
  public activePhase: ProgramPhase;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public isLoading: boolean;

  public columnDefaults: any;
  public columns: PersonTableColumn[] = [];
  private standardColumns: PersonTableColumn[] = [];
  private paymentColumnTemplate: PaymentColumn;
  public paymentHistoryColumn: PaymentColumn;
  private pastTransactions: Transaction[] = [];
  private lastPaymentId: number;

  private allPeopleData: Person[];
  public allPeopleAffected: PersonRow[] = [];
  public selectedPeople: PersonRow[] = [];
  private phaseSpecificPeopleAffected: PersonRow[] = [];
  private initialVisiblePeopleAffected: PersonRow[] = [];
  public visiblePeopleAffected: PersonRow[] = [];
  public filterRowsVisibleQuery: string;
  public showAllStatusState = false;
  private filterVal: string;

  public headerChecked = false;
  public headerSelectAllVisible = false;

  public isInProgress = false;
  public paymentInProgress = false;

  public submitPaymentProps: SubmitPaymentProps;
  public emptySeparatorWidth = 40;

  public action: BulkActionId = BulkActionId.chooseAction;
  public BulkActionEnum = BulkActionId;
  public bulkActions: BulkAction[] = [
    {
      id: BulkActionId.invite,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.invite',
      ),
      permissions: [Permission.RegistrationStatusInvitedUPDATE],
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
      permissions: [Permission.RegistrationStatusNoLongerEligibleUPDATE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.selectForValidation,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.select-for-validation',
      ),
      permissions: [Permission.RegistrationStatusSelectedForValidationUPDATE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: false,
    },
    {
      id: BulkActionId.include,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.include',
      ),
      permissions: [Permission.RegistrationStatusIncludedUPDATE],
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
      id: BulkActionId.reject,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.reject',
      ),
      permissions: [Permission.RegistrationStatusRejectedUPDATE],
      phases: [ProgramPhase.inclusion, ProgramPhase.payment],
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
      permissions: [Permission.RegistrationStatusInclusionEndedUPDATE],
      phases: [ProgramPhase.payment],
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
      permissions: [Permission.RegistrationNotificationCREATE],
      phases: [
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.payment,
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
      permissions: [Permission.RegistrationDELETE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.divider,
      enabled: false,
      label: '-------------------------------',
      permissions: [Permission.PaymentCREATE],
      phases: [ProgramPhase.payment],
      showIfNoValidation: true,
    },
  ];
  public applyBtnDisabled = true;
  public submitWarning: any;

  public canViewPersonalData: boolean;
  private canUpdatePaData: boolean;
  private canUpdatePersonalData: boolean;
  private canViewPaymentData: boolean;
  private canViewVouchers: boolean;
  private canDoSinglePayment: boolean;
  private routerSubscription: Subscription;

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
    private translatableStringService: TranslatableStringService,
  ) {
    this.locale = environment.defaultLocale;
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes(this.thisPhase)) {
          this.refreshData();
        }
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
        ProgramPhase.payment,
      ],
      permissions: [Permission.RegistrationREAD],
      showIfNoValidation: true,
      headerClass: 'ion-text-wrap ion-align-self-end',
    };
    const columnDateTimeWidth = 142;
    const columnScoreWidth = 90;
    const columnPhoneNumberWidth = 130;

    this.standardColumns = [
      {
        prop: 'name',
        name: this.translate.instant(
          'page.program.program-people-affected.column.name',
        ),
        ...this.columnDefaults,
        frozenLeft: this.platform.width() > 768,
        permissions: [Permission.RegistrationPersonalREAD],
      },
      {
        prop: 'phoneNumber',
        name: this.translate.instant(
          'page.program.program-people-affected.column.phone-number',
        ),
        ...this.columnDefaults,
        frozenLeft: this.platform.width() > 1280,
        permissions: [Permission.RegistrationPersonalREAD],
        minWidth: columnPhoneNumberWidth,
      },
      {
        prop: 'preferredLanguage',
        name: this.translate.instant(
          'page.program.program-people-affected.column.preferredLanguage',
        ),
        ...this.columnDefaults,
        permissions: [Permission.RegistrationPersonalREAD],
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
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        width: columnDateTimeWidth,
      },
      {
        prop: 'selectedForValidation',
        name: this.translate.instant(
          'page.program.program-people-affected.column.selected-for-validation',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
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
        phases: [ProgramPhase.inclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'rejected',
        name: this.translate.instant(
          'page.program.program-people-affected.column.rejected',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.inclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'inclusionEnded',
        name: this.translate.instant(
          'page.program.program-people-affected.column.inclusion-ended',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.inclusion, ProgramPhase.payment],
        width: columnDateTimeWidth,
      },
      {
        prop: 'paymentAmountMultiplier',
        name: this.translate.instant(
          'page.program.program-people-affected.column.paymentAmountMultiplier',
        ),
        ...this.columnDefaults,
        width: columnScoreWidth,
      },
      {
        prop: 'fsp',
        name: this.translate.instant(
          'page.program.program-people-affected.column.fsp',
        ),
        ...this.columnDefaults,
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
      permissions: [Permission.PaymentTransactionREAD],
    };
  }
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    this.isLoading = true;

    this.program = await this.programsService.getProgramById(this.programId);
    this.paTableAttributes = await this.programsService.getPaTableAttributes(
      this.programId,
      this.thisPhase,
    );
    this.activePhase = this.program.phase;

    this.paymentInProgress =
      await this.pastPaymentsService.checkPaymentInProgress(this.program.id);

    this.canUpdatePaData = this.authService.hasAllPermissions([
      Permission.RegistrationAttributeUPDATE,
    ]);
    this.canViewPersonalData = this.authService.hasAllPermissions([
      Permission.RegistrationPersonalREAD,
    ]);
    this.canUpdatePersonalData = this.authService.hasAllPermissions([
      Permission.RegistrationPersonalUPDATE,
    ]);
    this.canViewPaymentData = this.authService.hasAllPermissions([
      Permission.PaymentREAD,
      Permission.PaymentTransactionREAD,
    ]);
    this.canViewVouchers = this.authService.hasAllPermissions([
      Permission.PaymentVoucherREAD,
    ]);
    this.canDoSinglePayment = this.authService.hasAllPermissions([
      Permission.ActionREAD,
      Permission.PaymentCREATE,
      Permission.PaymentREAD,
      Permission.PaymentTransactionREAD,
    ]);

    await this.loadColumns();

    if (this.canViewPaymentData) {
      this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
        this.programId,
      );
      const firstPaymentToShow = 1;

      if (this.thisPhase === ProgramPhase.payment) {
        this.pastTransactions = await this.programsService.getTransactions(
          this.programId,
          firstPaymentToShow,
        );
        this.paymentHistoryColumn = this.createPaymentHistoryColumn();
      }
    }

    await this.refreshData();

    await this.updateBulkActions();

    this.submitPaymentProps = {
      programId: this.programId,
      payment: null,
      referenceIds: [],
    };

    // Timeout to make sure the datatable elements are rendered/generated:
    window.setTimeout(() => {
      this.setupProxyScrollbar();
    }, 0);

    // Listen for external signals to refresh data shown in table:
    this.pubSub.subscribe(PubSubEvent.dataRegistrationChanged, () => {
      this.refreshData();
    });
  }

  private setupProxyScrollbar() {
    const proxyScrollElement = this.proxyScrollbar.nativeElement;
    const config = proxyScrollElement.dataset;

    if (
      !proxyScrollElement ||
      !config ||
      !config.targetScrollElementSelector ||
      !config.targetWidthElementSelector
    ) {
      return;
    }

    const parentScope = this.proxyScrollbar.nativeElement.parentElement;

    const targetScrollElement: HTMLElement = parentScope.querySelector(
      config.targetScrollElementSelector,
    );

    if (!targetScrollElement) {
      return;
    }

    // Link scroll-events of proxy and target-elements:
    proxyScrollElement.addEventListener('scroll', () => {
      targetScrollElement.scrollLeft = proxyScrollElement.scrollLeft;
    });
    targetScrollElement.addEventListener('scroll', () => {
      proxyScrollElement.scrollLeft = targetScrollElement.scrollLeft;
    });

    // Set initial size of proxy-content:
    this.updateProxyScrollbarSize();
  }

  private updateProxyScrollbarSize() {
    window.setTimeout(() => {
      const proxyScrollElement = this.proxyScrollbar.nativeElement;
      const proxyScrollbarWidthElement: HTMLElement =
        proxyScrollElement.querySelector('.proxy-scrollbar--content');
      if (!proxyScrollElement || !proxyScrollbarWidthElement) {
        return;
      }

      let targetWidth = '';
      const targetWidthElement: HTMLElement =
        proxyScrollElement.parentElement.querySelector(
          proxyScrollElement.dataset.targetWidthElementSelector,
        );

      if (targetWidthElement) {
        targetWidth = targetWidthElement.style.width;
      }
      proxyScrollbarWidthElement.style.width = targetWidth;
    }, 0);
  }

  private async loadColumns() {
    const columnsPerPhase = await this.programsService.getPaTableAttributes(
      this.programId,
      this.thisPhase,
    );
    this.columns = [];

    for (const column of this.standardColumns) {
      if (
        column.phases.includes(this.thisPhase) &&
        this.authService.hasAllPermissions(column.permissions) &&
        this.checkValidationColumnOrAction(column)
      ) {
        this.columns.push(column);
      }
    }
    for (const colPerPhase of columnsPerPhase) {
      const translationKey = `page.program.program-people-affected.column.${colPerPhase.name}`;
      let name = this.translate.instant(translationKey);
      if (name === translationKey) {
        name = this.translatableStringService.get(colPerPhase.label);
      }
      const addCol = {
        prop: colPerPhase.name,
        name,
        ...this.columnDefaults,
        permissions: [Permission.RegistrationPersonalREAD],
        phases: colPerPhase.phases,
        headerClass: 'ion-text-wrap ion-align-self-end',
      };
      this.columns.push(addCol);
    }
  }

  private checkValidationColumnOrAction(columnOrAction) {
    return (
      (columnOrAction.showIfNoValidation && !this.program.validation) ||
      this.program.validation
    );
  }

  private createPaymentHistoryColumn(): PaymentColumn {
    const column = Object.assign({}, this.paymentColumnTemplate);
    column.name = 'Payment History';
    column.prop = 'paymentHistory';
    return column;
  }

  private async updateBulkActions() {
    await this.addPaymentBulkActions();

    this.bulkActions = this.bulkActions.map((action) => {
      action.enabled =
        this.authService.hasAllPermissions(action.permissions) &&
        action.phases.includes(this.thisPhase) &&
        this.checkValidationColumnOrAction(action);
      return action;
    });
  }

  private async addPaymentBulkActions() {
    const nextPaymentId = await this.pastPaymentsService.getNextPaymentId(
      this.program,
    );
    let paymentId = nextPaymentId || this.program.distributionDuration;

    // Add bulk-action for 1st upcoming payment & past 5 payments
    // Note, the number 5 is the same as allowed for the single payment as set in payment-history-popup.component
    while (paymentId > nextPaymentId - 6 && paymentId > 0) {
      const paymentBulkAction = {
        id: BulkActionId.doPayment,
        enabled: true,
        label: `${this.translate.instant(
          'page.program.program-people-affected.actions.do-payment',
        )} #${paymentId}`,
        permissions: [Permission.PaymentCREATE],
        phases: [ProgramPhase.payment],
        showIfNoValidation: true,
      };
      this.bulkActions.push(paymentBulkAction);
      paymentId--;
    }
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
    this.filterPeopleAffectedByPhase();
  }

  private filterPeopleAffectedByPhase() {
    let paStatusesToShow: PaStatus[];
    switch (this.thisPhase) {
      case ProgramPhase.registrationValidation:
        paStatusesToShow = [
          PaStatus.imported,
          PaStatus.invited,
          PaStatus.startedRegistration,
          PaStatus.selectedForValidation,
          PaStatus.registered,
          PaStatus.noLongerEligible,
          PaStatus.registeredWhileNoLongerEligible,
        ];
        break;
      case ProgramPhase.inclusion:
        paStatusesToShow = [
          PaStatus.validated,
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.rejected,
          PaStatus.inclusionEnded,
        ];
        break;
      case ProgramPhase.payment:
        paStatusesToShow = [PaStatus.included];
        break;
    }

    this.phaseSpecificPeopleAffected = this.allPeopleAffected.filter((pa) =>
      paStatusesToShow.includes(pa.status),
    );
    this.initialVisiblePeopleAffected = [...this.phaseSpecificPeopleAffected];
    this.visiblePeopleAffected = [...this.phaseSpecificPeopleAffected];
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
      preferredLanguage: person.preferredLanguage
        ? this.translate.instant(
            'page.program.program-people-affected.language.' +
              person.preferredLanguage,
          )
        : '',
      phoneNumber: formatPhoneNumber(person.phoneNumber),
      paymentAmountMultiplier: person.paymentAmountMultiplier
        ? `${person.paymentAmountMultiplier}&times;`
        : '',
      fsp: person.fsp,
      hasNote: !!person.hasNote,
      paTableAttributes: person.paTableAttributes,
    };

    if (this.canViewPaymentData) {
      personRow = this.fillPaymentHistoryColumn(personRow);
    }

    // Custom attributes can be personal data or not personal data
    // for now only users that view custom data can see it
    if (this.canViewPersonalData && personRow.paTableAttributes !== undefined) {
      personRow = this.fillPaTableAttributeRows(personRow);
    }

    return personRow;
  }

  private getTransactionOfPaymentForRegistration(
    paymentIndex: number,
    referenceId: string,
  ): Transaction {
    return this.pastTransactions.find(
      (transaction) =>
        transaction.payment === paymentIndex &&
        transaction.referenceId === referenceId,
    );
  }

  private fillPaTableAttributeRows(personRow: PersonRow): PersonRow {
    for (const paTableAttribute of this.paTableAttributes) {
      personRow[paTableAttribute.name] =
        personRow.paTableAttributes[paTableAttribute.name].value;
    }
    return personRow;
  }

  private fillPaymentHistoryColumn(personRow: PersonRow): PersonRow {
    let lastPayment = null;

    for (
      let paymentIndex = this.lastPaymentId;
      paymentIndex > 0;
      paymentIndex--
    ) {
      const transaction = this.getTransactionOfPaymentForRegistration(
        paymentIndex,
        personRow.referenceId,
      );

      if (!transaction) {
        continue;
      } else {
        lastPayment = transaction;
        break;
      }
    }

    let paymentColumnValue = new PaymentColumnDetail();
    paymentColumnValue.payments = [];

    const paymentHistoryButtonKey = 'paymentHistoryButton';

    if (!lastPayment) {
      paymentColumnValue.text = this.translate.instant(
        'page.program.program-people-affected.transaction.no-payment-yet',
      );
      personRow[paymentHistoryButtonKey] = paymentColumnValue.text;
    } else {
      const pastTransactionsOfPa = this.pastTransactions.filter(
        (transaction) => transaction.referenceId === personRow.referenceId,
      );

      paymentColumnValue = {
        text: '',
        paymentIndex: lastPayment.payment,
        payments: pastTransactionsOfPa.map((t) => t.payment),
        amount: `${this.program.currency} ${lastPayment.amount}`,
        hasMessageIcon: this.enableMessageSentIcon(lastPayment),
        hasMoneyIconTable: this.enableMoneySentIconTable(lastPayment),
      };
      if (lastPayment.status === StatusEnum.success) {
        paymentColumnValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.success',
        );
      } else if (lastPayment.status === StatusEnum.waiting) {
        paymentColumnValue.errorMessage = this.translate.instant(
          'page.program.program-people-affected.transaction.waiting-message',
        );
        paymentColumnValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.waiting',
        );
      } else {
        paymentColumnValue.errorMessage = lastPayment.error;
        paymentColumnValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.failed',
        );
      }
      personRow[paymentHistoryButtonKey] =
        this.translate.instant(
          'page.program.program-people-affected.transaction.payment-number',
        ) +
        paymentColumnValue.paymentIndex +
        ' ' +
        paymentColumnValue.text;
    }

    personRow.paymentHistory = paymentColumnValue;
    return personRow;
  }

  public enableMessageSentIcon(transaction: Transaction): boolean {
    return (
      transaction.customData &&
      [
        IntersolvePayoutStatus.initialMessage,
        IntersolvePayoutStatus.voucherSent,
      ].includes(transaction.customData.IntersolvePayoutStatus)
    );
  }

  public enableMoneySentIconTable(transaction: Transaction): boolean {
    return (
      (!transaction.customData.IntersolvePayoutStatus ||
        transaction.customData.IntersolvePayoutStatus ===
          IntersolvePayoutStatus.voucherSent) &&
      transaction.status === StatusEnum.success
    );
  }

  public hasVoucherSupport(fsp: string): boolean {
    const voucherFsps = ['Intersolve-no-whatsapp', 'Intersolve-whatsapp'];
    return voucherFsps.includes(fsp);
  }

  public showInclusionScore(): boolean {
    let show = false;
    for (const pa of this.allPeopleAffected) {
      show = !!pa.inclusionScore;
      if (show) {
        break;
      }
    }
    return show;
  }

  public showWhatsappNumber(): boolean {
    let show = false;
    for (const pa of this.allPeopleAffected) {
      show = this.hasVoucherSupport(pa.fsp);
      if (show) {
        break;
      }
    }
    return show;
  }

  public hasError(row: PersonRow): boolean {
    return !!row.paymentHistory.errorMessage;
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
        readOnly: !this.canUpdatePaData,
        canViewPersonalData: this.canViewPersonalData,
        canUpdatePersonalData: this.canUpdatePersonalData,
      },
    });

    await modal.present();
  }

  public async paymentHistoryPopup(personRow: PersonRow, programId: number) {
    const person = this.allPeopleData.find(
      (pa) => pa.referenceId === personRow.referenceId,
    );
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentHistoryPopupComponent,
      componentProps: {
        person,
        personRow,
        programId,
        program: this.program,
        readOnly: !this.canUpdatePaData,
        canViewPersonalData: this.canViewPersonalData,
        canUpdatePersonalData: this.canUpdatePersonalData,
        canDoSinglePayment: this.canDoSinglePayment,
        canViewVouchers: this.canViewVouchers,
      },
    });
    await modal.present();
  }

  public selectAction($event) {
    if (this.action === BulkActionId.chooseAction) {
      this.resetBulkAction();
      return;
    }

    if (this.action === BulkActionId.doPayment) {
      const dropdownOptionLabel =
        $event.target.options[$event.target.options.selectedIndex].text;
      this.submitPaymentProps.payment = Number(
        dropdownOptionLabel.split('#')[1],
      );
    }
    this.allPeopleAffected = this.updatePeopleForAction(
      this.allPeopleAffected,
      this.action,
      this.submitPaymentProps.payment,
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

  private updatePeopleForAction(
    people: PersonRow[],
    action: BulkActionId,
    payment?: number,
  ) {
    return people.map((person) =>
      this.bulkActionService.updateCheckbox(action, person, payment),
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
    this.showAllStatusState = false;
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
    const permission = this.canDoSinglePayment;
    const included = row.status === PaStatus.included;
    const noPaymentDone = !row[column.prop];
    const noFuturePayment = column.paymentIndex <= this.lastPaymentId;
    const onlyLast3Payments = column.paymentIndex > this.lastPaymentId - 3;
    const noPaymentInProgress = !this.paymentInProgress;
    return (
      permission &&
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

    if (this.action === BulkActionId.doPayment) {
      this.submitPaymentProps.referenceIds = this.selectedPeople.map(
        (p) => p.referenceId,
      );
    }

    if (this.selectedPeople.length) {
      this.applyBtnDisabled = false;
    } else {
      this.applyBtnDisabled = true;
    }
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
      { message: confirmInput },
    );

    const actionStatus = {
      [BulkActionId.invite]: PaStatus.invited,
      [BulkActionId.selectForValidation]: PaStatus.selectedForValidation,
      [BulkActionId.include]: PaStatus.included,
      [BulkActionId.endInclusion]: PaStatus.inclusionEnded,
      [BulkActionId.reject]: PaStatus.rejected,
      [BulkActionId.markNoLongerEligible]: PaStatus.noLongerEligible,
    };

    if (actionStatus[this.action]) {
      this.actionResult(
        `<p>${this.translate.instant(
          'page.program.program-people-affected.status-changed',
          {
            pastatus: this.translate
              .instant(
                'page.program.program-people-affected.status.' +
                  actionStatus[this.action],
              )
              .toLowerCase(),
            panumber: this.selectedPeople.length,
          },
        )}
          <p>${this.translate.instant(
            'page.program.program-people-affected.pa-moved-phase',
          )}</p>`,
      );
    }

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
    this.filterVal = value;
    const filterVal = value?.toLowerCase().trim();
    const rowsVisible = this.initialVisiblePeopleAffected.filter(
      (row: PersonRow) => {
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
      },
    );

    this.visiblePeopleAffected = rowsVisible;
    this.updateProxyScrollbarSize();
  }

  public toggleShowAllStatusState() {
    const newState = !this.showAllStatusState;
    if (newState) {
      this.initialVisiblePeopleAffected = [...this.allPeopleAffected];
    } else {
      this.initialVisiblePeopleAffected = [...this.phaseSpecificPeopleAffected];
    }
    this.visiblePeopleAffected = [...this.initialVisiblePeopleAffected];
    this.filterRowsVisible(this.filterVal);
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
    this.updateProxyScrollbarSize();
    this.isLoading = false;
  }

  public onCheckboxChange(row: PersonRow, column: any, value: string) {
    this.programsService
      .updatePaAttribute(row.referenceId, column.prop, value)
      .then(
        () => {
          row[column.prop] = value;
          const valueKey = 'value';
          row.paTableAttributes[column.prop][valueKey] = value;
          this.actionResult(this.translate.instant('common.update-success'));
        },
        (error) => {
          console.log('error: ', error);
          if (error && error.error) {
            const errorMessage = this.translate.instant('common.update-error', {
              error: this.formatErrors(error.error, column.prop),
            });
            this.actionResult(errorMessage);
          }
        },
      );
  }

  private formatErrors(error, attribute: string): string {
    if (error.errors) {
      return this.formatConstraintsErrors(error.errors, attribute);
    }
    if (error.message) {
      return '<br><br>' + error.message + '<br>';
    }
  }

  private formatConstraintsErrors(errors, attribute: string): string {
    const attributeError = errors.find(
      (message) => message.property === attribute,
    );
    const attributeConstraints = Object.values(attributeError.constraints);
    return '<br><br>' + attributeConstraints.join('<br>');
  }
}
