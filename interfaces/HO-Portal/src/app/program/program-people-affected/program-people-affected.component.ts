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
import {
  AlertController,
  ModalController,
  Platform,
  PopoverController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { BulkAction, BulkActionId } from 'src/app/models/bulk-actions.models';
import { AnswerType } from 'src/app/models/fsp.model';
import { PaymentColumnDetail } from 'src/app/models/payment.model';
import {
  PA_STATUS_ORDER,
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
import {
  TableFilterMultipleChoiceOption,
  TableFilterType,
} from 'src/app/models/table-filter.model';
import { IntersolvePayoutStatus } from 'src/app/models/transaction-custom-data';
import { Transaction } from 'src/app/models/transaction.model';
import { TranslatableString } from 'src/app/models/translatable-string.model';
import { BulkActionsService } from 'src/app/services/bulk-actions.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { formatPhoneNumber } from 'src/app/shared/format-phone-number';
import { environment } from 'src/environments/environment';
import { MessageHistoryPopupComponent } from '../../components/message-history-popup/message-history-popup.component';
import RegistrationStatus from '../../enums/registration-status.enum';
import { ActionType } from '../../models/actions.model';
import {
  MessageStatus,
  MessageStatusMapping,
} from '../../models/message.model';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { PastPaymentsService } from '../../services/past-payments.service';
import { arrayToXlsx } from '../../shared/array-to-xlsx';
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

  private columnWidthPerType = {
    [AnswerType.Number]: 90,
    [AnswerType.Date]: 150,
    [AnswerType.PhoneNumber]: 130,
    [AnswerType.Text]: 150,
    [AnswerType.Enum]: 160,
    [AnswerType.Email]: 180,
    [AnswerType.Boolean]: 90,
    [AnswerType.MultiSelect]: 180,
  };
  public columnDefaults: any;
  public columns: PersonTableColumn[] = [];
  private standardColumns: PersonTableColumn[] = [];
  public paymentHistoryColumn: PersonTableColumn;
  private lastPaymentId: number;

  private allPeopleData: Person[];
  public allPeopleAffected: PersonRow[] = [];
  public selectedPeople: PersonRow[] = [];
  private phaseSpecificPeopleAffected: PersonRow[] = [];
  private initialVisiblePeopleAffected: PersonRow[] = [];
  public visiblePeopleAffected: PersonRow[] = [];
  public filterRowsVisibleQuery: string;

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
      phases: [ProgramPhase.inclusion, ProgramPhase.payment],
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
      phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
      showIfNoValidation: true,
      confirmConditions: {
        inputRequired: false,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.delete-warning',
        ),
      },
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

  public tableFilterType = TableFilterType;

  public canViewPersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canUpdatePaData: boolean;
  private canUpdatePersonalData: boolean;
  private canViewPaymentData: boolean;
  private canViewVouchers: boolean;
  private canDoSinglePayment: boolean;
  private routerSubscription: Subscription;
  private pubSubSubscription: Subscription;

  public isStatusFilterPopoverOpen = false;
  private PAYMENTS_LEFT_ORDER = [0, 1, 2, 3, -1, -2];
  public tableFilters = [
    {
      prop: 'paymentsLeft',
      type: this.tableFilterType.multipleChoice,
      description: 'remaining-payment-description',
    },
    {
      prop: 'paStatus',
      type: this.tableFilterType.multipleChoice,
      description: 'multiple-choice-hidden-options',
    },
  ];
  public tableFilterState = {
    text: '',
    paStatus: {
      default: [],
      selected: [],
      visible: [],
    },
    paymentsLeft: {
      default: [],
      selected: [],
      visible: [],
    },
  };

  private messageColumnStatus = MessageStatusMapping;

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    private bulkActionService: BulkActionsService,
    private pastPaymentsService: PastPaymentsService,
    private alertController: AlertController,
    public modalController: ModalController,
    public popoverController: PopoverController,
    public platform: Platform,
    private pubSub: PubSubService,
    private router: Router,
    private translatableStringService: TranslatableStringService,
    private errorHandlerService: ErrorHandlerService,
  ) {
    this.locale = environment.defaultLocale;
    this.routerSubscription = this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes(this.thisPhase)) {
          this.initComponent();
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

    this.standardColumns = [
      {
        prop: 'name',
        name: this.translate.instant(
          'page.program.program-people-affected.column.name',
        ),
        ...this.columnDefaults,
        frozenLeft: this.platform.width() > 768,
        permissions: [Permission.RegistrationPersonalREAD],
        minWidth: this.columnWidthPerType[AnswerType.Text],
        width: this.columnWidthPerType[AnswerType.Text],
      },
      {
        prop: 'phoneNumber',
        name: this.translate.instant(
          'page.program.program-people-affected.column.phone-number',
        ),
        ...this.columnDefaults,
        frozenLeft: this.platform.width() > 1280,
        permissions: [Permission.RegistrationPersonalREAD],
        minWidth: this.columnWidthPerType[AnswerType.PhoneNumber],
        width: this.columnWidthPerType[AnswerType.PhoneNumber],
      },
      {
        prop: 'preferredLanguage',
        name: this.translate.instant(
          'page.program.program-people-affected.column.preferredLanguage',
        ),
        ...this.columnDefaults,
        permissions: [Permission.RegistrationPersonalREAD],
        minWidth: this.columnWidthPerType[AnswerType.Text],
        width: this.columnWidthPerType[AnswerType.Text],
      },
      {
        prop: 'statusLabel',
        name: this.translate.instant(
          'page.program.program-people-affected.column.status',
        ),
        ...this.columnDefaults,
        minWidth: 135,
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
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'invited',
        name: this.translate.instant(
          'page.program.program-people-affected.column.invited',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'markedNoLongerEligible',
        name: this.translate.instant(
          'page.program.program-people-affected.column.no-longer-eligible',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'digitalIdCreated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.digital-id-created',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'vulnerabilityAssessmentCompleted',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-completed',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'selectedForValidation',
        name: this.translate.instant(
          'page.program.program-people-affected.column.selected-for-validation',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
        showIfNoValidation: false,
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'vulnerabilityAssessmentValidated',
        name: this.translate.instant(
          'page.program.program-people-affected.column.vulnerability-assessment-validated',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.registrationValidation],
        showIfNoValidation: false,
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'included',
        name: this.translate.instant(
          'page.program.program-people-affected.column.included',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.inclusion, ProgramPhase.payment],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'rejected',
        name: this.translate.instant(
          'page.program.program-people-affected.column.rejected',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.inclusion],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'inclusionEnded',
        name: this.translate.instant(
          'page.program.program-people-affected.column.inclusion-ended',
        ),
        ...this.columnDefaults,
        phases: [ProgramPhase.inclusion],
        minWidth: this.columnWidthPerType[AnswerType.Date],
        width: this.columnWidthPerType[AnswerType.Date],
      },
      {
        prop: 'paymentAmountMultiplier',
        name: this.translate.instant(
          'page.program.program-people-affected.column.paymentAmountMultiplier',
        ),
        ...this.columnDefaults,
        minWidth: this.columnWidthPerType[AnswerType.Number],
        width: this.columnWidthPerType[AnswerType.Number],
      },
      {
        prop: 'maxPayments',
        name: this.translate.instant(
          'page.program.program-people-affected.column.maxPayments',
        ),
        ...this.columnDefaults,
        minWidth: 150,
        width: 150,
      },
      {
        prop: 'fsp',
        name: this.translate.instant(
          'page.program.program-people-affected.column.fsp',
        ),
        ...this.columnDefaults,
        minWidth: 150,
        width: 150,
      },
      {
        prop: 'messages',
        name: this.translate.instant(
          'page.program.program-people-affected.column.last-message-status',
        ),
        ...this.columnDefaults,
        phases: [
          ProgramPhase.registrationValidation,
          ProgramPhase.inclusion,
          ProgramPhase.payment,
        ],
        minWidth: 200,
        width: 200,
      },
    ];
  }
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.pubSubSubscription) {
      this.pubSubSubscription.unsubscribe();
    }
  }

  async ngOnInit() {}

  async initComponent() {
    this.isLoading = true;

    this.paTableAttributes = await this.programsService.getPaTableAttributes(
      this.programId,
      this.thisPhase,
    );

    this.paymentInProgress =
      await this.pastPaymentsService.checkPaymentInProgress(this.programId);

    await this.refreshData(true);

    this.activePhase = this.program.phase;

    await this.loadColumns();

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
    if (!this.pubSubSubscription) {
      this.pubSubSubscription = this.pubSub.subscribe(
        PubSubEvent.dataRegistrationChanged,
        () => {
          if (this.router.url.includes(this.thisPhase)) {
            this.refreshData();
          }
        },
      );
    }

    this.updateProxyScrollbarSize();
  }

  private async refreshData(refresh: boolean = false) {
    this.isLoading = true;
    await this.loadProgram();
    await this.loadPermissions();
    if (this.canViewPaymentData) {
      this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
        this.programId,
      );
    }
    await this.loadData(refresh);
    await this.resetBulkAction();
    this.updateProxyScrollbarSize();
    this.isLoading = false;
  }

  private async loadProgram() {
    this.program = await this.programsService.getProgramById(this.programId);
  }
  private async loadPermissions() {
    this.canUpdatePaData = this.authService.hasAllPermissions(this.programId, [
      Permission.RegistrationAttributeUPDATE,
    ]);
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalREAD],
    );
    this.canUpdatePersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalUPDATE],
    );
    this.canViewMessageHistory = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationNotificationREAD],
    );
    this.canViewPaymentData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );
    this.canViewVouchers = this.authService.hasAllPermissions(this.programId, [
      Permission.PaymentVoucherREAD,
    ]);
    this.canDoSinglePayment = this.authService.hasAllPermissions(
      this.programId,
      [
        Permission.ActionREAD,
        Permission.PaymentCREATE,
        Permission.PaymentREAD,
        Permission.PaymentTransactionREAD,
      ],
    );
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
    this.columns = [];

    for (const column of this.standardColumns) {
      if (
        column.phases.includes(this.thisPhase) &&
        this.authService.hasAllPermissions(
          this.programId,
          column.permissions,
        ) &&
        this.checkValidationColumnOrAction(column) &&
        this.showMaxPaymentsColumn(column)
      ) {
        this.columns.push(column);
      }
    }

    const columnsPerPhase = await this.programsService.getPaTableAttributes(
      this.programId,
      this.thisPhase,
    );

    if (!columnsPerPhase) {
      return;
    }

    for (const colPerPhase of columnsPerPhase) {
      const addCol = {
        prop: colPerPhase.name,
        name: this.createColumnNameLabel(
          colPerPhase.name,
          colPerPhase.shortLabel,
        ),
        ...this.columnDefaults,
        permissions: [Permission.RegistrationPersonalREAD],
        phases: colPerPhase.phases,
        headerClass: 'ion-align-self-end header-overflow-ellipsis',
      };
      if (!!this.columnWidthPerType[colPerPhase.type]) {
        addCol.minWidth = this.columnWidthPerType[colPerPhase.type];
        addCol.width = this.columnWidthPerType[colPerPhase.type];
      } else {
        addCol.minWidth = this.columnWidthPerType.text;
        addCol.width = this.columnWidthPerType.text;
      }
      if (
        this.authService.hasAllPermissions(this.programId, addCol.permissions)
      ) {
        this.columns.push(addCol);
      }
    }
  }

  private checkValidationColumnOrAction(columnOrAction) {
    return (
      (columnOrAction.showIfNoValidation && !this.program.validation) ||
      this.program.validation
    );
  }

  private showMaxPaymentsColumn(column: PersonTableColumn): boolean {
    return (
      column.prop !== 'maxPayments' ||
      (column.prop === 'maxPayments' && this.program.enableMaxPayments)
    );
  }

  private createColumnNameLabel(
    columnName: string,
    columnShortlLabel?: TranslatableString,
  ): string {
    if (columnShortlLabel) {
      return this.translatableStringService.get(columnShortlLabel);
    }

    this.translate.instant(
      `page.program.program-people-affected.column.${columnName}`,
    );
  }

  private createPaymentHistoryColumn(): PersonTableColumn {
    return {
      prop: 'paymentHistory',
      name: this.translate.instant(
        'page.program.program-people-affected.column.payment-history',
      ),
      ...this.columnDefaults,
      phases: [ProgramPhase.payment],
      permissions: [Permission.RegistrationPersonalREAD],
      minWidth: 300,
      width: 300,
    };
  }

  private async updateBulkActions() {
    await this.addPaymentBulkActions();

    this.bulkActions = this.bulkActions.map((action) => {
      action.enabled =
        this.authService.hasAllPermissions(
          this.programId,
          action.permissions,
        ) &&
        action.phases.includes(this.thisPhase) &&
        this.checkValidationColumnOrAction(action);
      return action;
    });
  }

  private async addPaymentBulkActions() {
    // filter out all dopayment actions to avoid duplication
    this.bulkActions = this.bulkActions.filter(
      (action) => action.id !== BulkActionId.doPayment,
    );

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

  private async loadData(refresh: boolean = false) {
    this.allPeopleData = await this.programsService.getPeopleAffected(
      this.programId,
      this.canUpdatePersonalData,
      this.canViewPaymentData && this.thisPhase === ProgramPhase.payment,
    );

    if (this.canViewPaymentData && this.thisPhase === ProgramPhase.payment) {
      this.paymentHistoryColumn = this.createPaymentHistoryColumn();
    }

    this.allPeopleAffected = this.createTableData(this.allPeopleData);

    if (refresh) {
      this.setDefaultTableFilterOptions();
      this.filterPeopleAffectedByPhase();
      return;
    }

    this.updateVisiblePeopleAffectedByFilter();
  }

  private filterPeopleAffectedByPhase() {
    this.phaseSpecificPeopleAffected = this.allPeopleAffected.filter((pa) =>
      this.tableFilterState.paStatus.default.includes(pa.status),
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
    // If a person has registered while no longer eligeble the registeredWhileNoLongerEligibleDate
    // corresponds wuth the vulnerabilityAssessmentComplete time stamp
    const vulnerabilityAssessmentCompleteTime = person.registeredDate
      ? person.registeredDate
      : person.registeredWhileNoLongerEligibleDate;

    let personRow: PersonRow = {
      referenceId: person.referenceId,
      checkboxVisible: false,
      pa: `PA #${String(person.registrationProgramId)}`,
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
      vulnerabilityAssessmentCompleted: vulnerabilityAssessmentCompleteTime
        ? formatDate(
            vulnerabilityAssessmentCompleteTime,
            this.dateFormat,
            this.locale,
          )
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
      rejected: person.rejectionDate
        ? formatDate(person.rejectionDate, this.dateFormat, this.locale)
        : null,
      inclusionEnded: person.inclusionEndDate
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
        ? `${person.paymentAmountMultiplier}×`
        : '',
      paymentsLeft: person.maxPayments
        ? person.maxPayments - person.nrPayments
        : null,
      maxPayments: person.maxPayments
        ? `${person.maxPayments} ${
            this.thisPhase === ProgramPhase.payment
              ? `(${
                  person.maxPayments - person.nrPayments
                } ${this.translate.instant(
                  'page.program.program-people-affected.max-payments.left',
                )})`
              : ''
          }`
        : '',
      fsp: person.fsp,
      lastMessageStatus: person.lastMessageStatus,
      messages: person.lastMessageStatus
        ? `${this.translate.instant(
            'page.program.program-people-affected.message-history-popup.type.' +
              person.lastMessageType,
          )}: ${this.translate.instant(
            'page.program.program-people-affected.message-history-popup.chip-status.' +
              this.messageColumnStatus[person.lastMessageStatus],
          )}`
        : this.translate.instant(
            'page.program.program-people-affected.last-message.no-message',
          ),
      hasNote: !!person.hasNote,
      hasPhoneNumber: !!person.hasPhoneNumber,
      paTableAttributes: person.paTableAttributes,
    };

    const lastPaymentInfo = {
      lastPaymentNumber: person.payment,
      lastPaymentAmount: person.transactionAmount,
      lastPaymentStatus: person.transactionStatus,
      lastPaymentErrorMessage: person.errorMessage,
    };

    if (this.canViewPaymentData) {
      personRow = this.fillPaymentHistoryColumn(personRow, lastPaymentInfo);
    }

    // Custom attributes can be personal data or not personal data
    // for now only users that view custom data can see it
    if (this.canViewPersonalData && personRow.paTableAttributes !== undefined) {
      personRow = this.fillPaTableAttributeRows(personRow);
    }

    return personRow;
  }

  private fillPaTableAttributeRows(personRow: PersonRow): PersonRow {
    for (const paTableAttribute of this.paTableAttributes) {
      personRow[paTableAttribute.name] =
        personRow.paTableAttributes[paTableAttribute.name].value;
    }
    return personRow;
  }

  private fillPaymentHistoryColumn(
    personRow: PersonRow,
    lastPaymentInfo: {
      lastPaymentNumber: number;
      lastPaymentAmount: number;
      lastPaymentStatus: string;
      lastPaymentErrorMessage: string;
    },
  ): PersonRow {
    const {
      lastPaymentNumber,
      lastPaymentAmount,
      lastPaymentStatus,
      lastPaymentErrorMessage,
    } = lastPaymentInfo;

    let paymentColumnValue = new PaymentColumnDetail();

    const columnKey = 'paymentHistoryColumn';

    if (!lastPaymentNumber) {
      paymentColumnValue.text = this.translate.instant(
        'page.program.program-people-affected.transaction.no-payment-yet',
      );
      personRow[columnKey] = paymentColumnValue.text;
    } else {
      paymentColumnValue = {
        text: '',
        paymentIndex: lastPaymentNumber,
        amount: `${this.program.currency} ${lastPaymentAmount}`,
        status: lastPaymentStatus,
        errorMessage: lastPaymentErrorMessage,
      };
      if (lastPaymentStatus === StatusEnum.success) {
        paymentColumnValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.success',
        );
      } else if (lastPaymentStatus === StatusEnum.waiting) {
        paymentColumnValue.errorMessage = this.translate.instant(
          'page.program.program-people-affected.transaction.waiting-message',
        );
        paymentColumnValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.waiting',
        );
      } else {
        paymentColumnValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.failed',
        );
      }
      personRow[columnKey] =
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
    if (row.paymentHistory.errorMessage) {
      return true;
    }

    if (row.paymentHistory.status === StatusEnum.error) {
      return true;
    }

    return false;
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
        canViewMessageHistory: this.canViewMessageHistory,
        canViewPaymentData: this.canViewPaymentData,
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

  public async openMessageHistoryPopup(
    personRow: PersonRow,
    programId: number,
  ) {
    const person = this.allPeopleData.find(
      (pa) => pa.referenceId === personRow.referenceId,
    );

    const modal: HTMLIonModalElement = await this.modalController.create({
      component: MessageHistoryPopupComponent,
      componentProps: {
        person,
        programId,
      },
    });
    await modal.present();
  }

  public async selectAction($event) {
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
    this.allPeopleAffected = await this.updatePeopleForAction(
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

  private async updatePeopleForAction(
    people: PersonRow[],
    action: BulkActionId,
    payment?: number,
  ) {
    let registrationsWithPayment;
    if (payment) {
      registrationsWithPayment = (
        await this.programsService.getPeopleAffected(
          this.programId,
          false,
          false,
          payment,
        )
      ).map((r) => r.referenceId);
    }
    return people.map((person) =>
      this.bulkActionService.updateCheckbox(
        action,
        person,
        payment ? registrationsWithPayment.includes(person.referenceId) : null,
      ),
    );
  }

  private async resetBulkAction() {
    this.isInProgress = true;
    this.action = BulkActionId.chooseAction;
    this.applyBtnDisabled = true;
    this.toggleHeaderCheckbox();
    this.headerChecked = false;
    this.selectedPeople = [];
    this.isInProgress = false;
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
    const included = row.status === RegistrationStatus.included;
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
    this.bulkActionService
      .applyAction(this.action, this.programId, this.selectedPeople, {
        message: confirmInput,
      })
      .then(async () => {
        if (this.action === BulkActionId.sendMessage) {
          this.pubSub.publish(PubSubEvent.dataRegistrationChanged);
          return;
        }

        const actionStatus = {
          [BulkActionId.invite]: RegistrationStatus.invited,
          [BulkActionId.selectForValidation]:
            RegistrationStatus.selectedForValidation,
          [BulkActionId.include]: RegistrationStatus.included,
          [BulkActionId.endInclusion]: RegistrationStatus.inclusionEnded,
          [BulkActionId.reject]: RegistrationStatus.rejected,
          [BulkActionId.markNoLongerEligible]:
            RegistrationStatus.noLongerEligible,
        };
        if (!actionStatus[this.action]) {
          return;
        }

        await this.actionResult(
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
      })
      .catch((error) => {
        console.log('Error:', error);
        this.actionResult(error.error.errors.join('<br><br>'));
      });
  }

  private async actionResult(resultMessage: string, refresh: boolean = false) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            alert.dismiss(true);
            this.pubSub.publish(PubSubEvent.dataRegistrationChanged);
            if (refresh) {
              window.location.reload();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private setTextFieldFilter(value: string) {
    this.tableFilterState.text = value;
  }

  public applyTextFieldFilter(value: string) {
    this.setTextFieldFilter(value?.toLowerCase().trim());
    this.updateVisiblePeopleAffectedByFilter();
  }

  public paComparator(a: string, b: string) {
    // Use numeric sorting for 'text'-values, so the order will be: "PA #1" < "PA #2" < "PA #10"
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  public onCheckboxChange(row: PersonRow, column: any, value: string) {
    this.programsService
      .updatePaAttribute(this.programId, row.referenceId, column.prop, value)
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
              error: this.errorHandlerService.formatErrors(
                error.error,
                column.prop,
              ),
            });
            this.actionResult(errorMessage);
          }
        },
      );
  }

  private setDefaultTableFilterOptions() {
    // text
    this.filterRowsVisibleQuery = '';
    this.tableFilterState.text = '';
    // pa status
    const paStatusDefaults = {
      [ProgramPhase.registrationValidation]: [
        RegistrationStatus.imported,
        RegistrationStatus.invited,
        RegistrationStatus.startedRegistration,
        RegistrationStatus.selectedForValidation,
        RegistrationStatus.registered,
        RegistrationStatus.noLongerEligible,
        RegistrationStatus.registeredWhileNoLongerEligible,
      ],
      [ProgramPhase.inclusion]: [
        RegistrationStatus.validated,
        RegistrationStatus.registered,
        RegistrationStatus.selectedForValidation,
        RegistrationStatus.rejected,
        RegistrationStatus.inclusionEnded,
      ],
      [ProgramPhase.payment]: [
        RegistrationStatus.included,
        RegistrationStatus.completed,
      ],
    };
    this.tableFilterState.paStatus.default = paStatusDefaults[this.thisPhase];
    this.tableFilterState.paStatus.visible =
      this.setTableFilterVisibleOptions('paStatus');
    this.tableFilterState.paStatus.selected = [
      ...this.tableFilterState.paStatus.default,
    ];

    // payments left
    this.tableFilterState.paymentsLeft.default = this.PAYMENTS_LEFT_ORDER;
    this.tableFilterState.paymentsLeft.visible =
      this.setTableFilterVisibleOptions('paymentsLeft');
    this.tableFilterState.paymentsLeft.selected = [
      ...this.tableFilterState.paymentsLeft.default,
    ];
  }

  public setTableFilterVisibleOptions(prop): TableFilterMultipleChoiceOption[] {
    switch (prop) {
      case 'paStatus':
        return this.getPaStatusVisibleOptions();
      case 'paymentsLeft':
        return this.getPaymentsLeftVisibleOptions();
    }
  }

  public getPaStatusVisibleOptions(): TableFilterMultipleChoiceOption[] {
    return PA_STATUS_ORDER.map(({ value }) => {
      const option: TableFilterMultipleChoiceOption = {
        value,
        label: this.translate.instant(
          'page.program.program-people-affected.status.' + value,
        ),
        count: this.getPaStatusCount(value),
      };
      return option;
    }).filter((o) => o.count > 0);
  }

  private getPaStatusCount(paStatus): number {
    return this.allPeopleAffected.filter((pa) => pa.status === paStatus).length;
  }

  public getPaymentsLeftVisibleOptions(): TableFilterMultipleChoiceOption[] {
    const labelPrefix =
      'page.program.program-people-affected.filter-btn.payments-left-option.';

    const otherKeys = {
      '-2': 'no-maximum',
      '-1': 'more-than-three',
    };

    return this.PAYMENTS_LEFT_ORDER.map((value) => ({
      value,
      label:
        value < 0
          ? this.translate.instant(`${labelPrefix}${otherKeys[value]}`)
          : value + this.translate.instant(`${labelPrefix}zero-three`),
      count: this.getPaymentsLeftCount(value),
    })).filter((o) => o.count > 0);
  }

  private getPaymentsLeftCount(value): number {
    return this.allPeopleAffected.filter((pa) => {
      if (value === -2) {
        return !pa.paymentsLeft && pa.maxPayments === '';
      }
      if (value === -1) {
        return pa.paymentsLeft > 3;
      }
      return pa.paymentsLeft === value;
    }).length;
  }

  private paPaymentsLeftValue(paymentsLeft, maxPayments): number {
    if (!paymentsLeft && maxPayments === '') {
      return -2;
    }

    if (paymentsLeft > 3) {
      return -1;
    }
    return paymentsLeft;
  }

  public applyTableFilter(prop, filter) {
    if (!filter) {
      return;
    }

    if (prop === 'paymentsLeft') {
      filter = filter.map((option) => Number(option));
    }

    if (this.tableFilterState[prop].selected === filter) {
      return;
    }

    this.tableFilterState[prop].selected = filter;
    this.updateVisiblePeopleAffectedByFilter();
  }

  private updateVisiblePeopleAffectedByFilter() {
    const filteredPeopleAffected = this.allPeopleAffected
      .filter((pa) =>
        this.tableFilterState.paStatus.selected.includes(pa.status),
      )
      .filter((pa) =>
        this.tableFilterState.paymentsLeft.selected.includes(
          this.paPaymentsLeftValue(pa.paymentsLeft, pa.maxPayments),
        ),
      );
    this.initialVisiblePeopleAffected = [...filteredPeopleAffected];

    const rowsVisible = this.initialVisiblePeopleAffected.filter(
      (row: PersonRow) => {
        // Loop over all columns
        for (const key of Object.keys(row)) {
          try {
            const columnValue = row[key].toLowerCase();
            const includeRow =
              columnValue.indexOf(this.tableFilterState.text) !== -1 || // check literal values
              columnValue
                .replace(/\s/g, '')
                .indexOf(this.tableFilterState.text) !== -1 || // check also with spaces removed
              !this.tableFilterState.text;
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

  public showTableFilter(prop): boolean {
    if (prop !== 'paymentsLeft' || this.thisPhase === this.phaseEnum.payment) {
      return true;
    }

    return false;
  }

  public hasMessageError(messageStatus): boolean {
    return this.messageColumnStatus[messageStatus] === MessageStatus.failed;
  }

  public hasMessageSuccess(messageStatus): boolean {
    return [
      MessageStatus.delivered,
      MessageStatus.read,
      MessageStatus.sent,
    ].includes(messageStatus);
  }

  public exportTableView() {
    try {
      const columnsToExport = [
        ...this.mapColumsForExport(true),
        ...this.mapColumsForExport(false),
      ];

      columnsToExport.unshift({
        prop: 'hasNote',
        name: this.translate.instant(
          'page.program.program-people-affected.column.hasNote',
        ),
      });
      columnsToExport.unshift({
        prop: 'pa',
        name: this.translate.instant(
          'page.program.program-people-affected.column.person',
        ),
      });

      if (
        this.showInclusionScore() &&
        [
          this.phaseEnum.registrationValidation,
          this.phaseEnum.inclusion,
        ].includes(this.thisPhase)
      ) {
        columnsToExport.push({
          prop: 'inclusionScore',
          name: this.translate.instant(
            'page.program.program-people-affected.column.inclusion-score',
          ),
        });
      }

      if (this.thisPhase === this.phaseEnum.payment) {
        {
          columnsToExport.push({
            prop: 'paymentHistoryColumn',
            name: this.paymentHistoryColumn.name || '',
          });
        }
      }

      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      const xlsxContent = this.visiblePeopleAffected
        .sort((a, b) => collator.compare(a.pa, b.pa))
        .map((person) =>
          columnsToExport.reduce((res, col) => {
            const value = this.processExportTableViewValue(person[col.prop]);
            return Object.assign(res, { [col.name]: value });
          }, {}),
        );

      arrayToXlsx(xlsxContent, `${this.thisPhase}-table`);

      this.programsService.saveAction(
        ActionType.exportTableView,
        this.programId,
      );

      this.actionResult(
        this.translate.instant(
          'page.program.program-people-affected.export-list.success-message',
        ),
      );
    } catch (error) {
      console.log('error: ', error);
      this.actionResult(this.translate.instant('common.export-error'));
    }
  }

  private mapColumsForExport(
    frozenLeft: boolean,
  ): { prop: string; name: string }[] {
    return this.columns
      .filter((c) => c.frozenLeft === frozenLeft)
      .map((col) => ({ prop: col.prop, name: col.name }));
  }

  private processExportTableViewValue(value) {
    if (typeof value === 'boolean') {
      return value ? 'yes' : 'no';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value;
  }
}
