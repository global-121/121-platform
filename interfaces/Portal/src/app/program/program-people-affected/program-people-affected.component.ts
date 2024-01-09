import { formatDate } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  ModalController,
  PopoverController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { SortDirection } from '@swimlane/ngx-datatable';
import { mergeWith, Observable, Subscription, throttleTime } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { DateFormat } from 'src/app/enums/date-format.enum';
import {
  BulkAction,
  BulkActionId,
  BulkActionRegistrationStatusMap,
  BulkActionResult,
} from 'src/app/models/bulk-actions.models';
import {
  Person,
  PersonRow,
  PersonTableColumn,
} from 'src/app/models/person.model';
import {
  PaTableAttribute,
  Program,
  ProgramPhase,
} from 'src/app/models/program.model';
import { TableFilterType } from 'src/app/models/table-filter.model';
import {
  BulkActionsService,
  CustomBulkActionInput,
} from 'src/app/services/bulk-actions.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { formatPhoneNumber } from 'src/app/shared/format-phone-number';
import { environment } from 'src/environments/environment';
import { MessageHistoryPopupComponent } from '../../components/message-history-popup/message-history-popup.component';
import RegistrationStatus from '../../enums/registration-status.enum';
import { AnswerType } from '../../models/fsp.model';
import {
  MessageStatus,
  MessageStatusMapping,
  MessageTemplate,
} from '../../models/message.model';
import { PaginationMetadata } from '../../models/pagination-metadata.model';
import { EnumService } from '../../services/enum.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import {
  Filter,
  FilterOperatorEnum,
  FilterService,
  PaginationFilter,
} from '../../services/filter.service';
import { PastPaymentsService } from '../../services/past-payments.service';
import { RegistrationsService } from '../../services/registrations.service';
import { TableService } from '../../services/table.service';
import { actionResult } from '../../shared/action-result';
import { SubmitPaymentProps } from '../../shared/confirm-prompt/confirm-prompt.component';
import { EditPersonAffectedPopupComponent } from '../edit-person-affected-popup/edit-person-affected-popup.component';
import { PaymentHistoryPopupComponent } from '../payment-history-popup/payment-history-popup.component';
import { TableFilterRowComponent } from '../table-filter-row/table-filter-row.component';

@Component({
  selector: 'app-program-people-affected',
  templateUrl: './program-people-affected.component.html',
  styleUrls: ['./program-people-affected.component.scss'],
})
export class ProgramPeopleAffectedComponent implements OnDestroy {
  @ViewChild('proxyScrollbar')
  private proxyScrollbar: ElementRef;
  @ViewChild('tableFilterRow')
  public tableFilterRow: TableFilterRowComponent;

  @Input()
  public programId: number;
  @Input()
  public thisPhase: ProgramPhase;
  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public phaseEnum = ProgramPhase;

  public program: Program;
  private paTableAttributes: PaTableAttribute[] = [];
  public activePhase: ProgramPhase;

  private locale: string;

  public isLoading: boolean;

  public columnDefaults: any;
  public columns: PersonTableColumn[] = [];
  public paymentHistoryColumn: PersonTableColumn;

  public selectedPeople: PersonRow[] = [];
  public selectedCount = 0;
  public visiblePeopleAffected: PersonRow[] = [];

  public isInProgress = false;

  public submitPaymentProps: SubmitPaymentProps;
  public emptySeparatorWidth = 40;

  public action: BulkActionId = BulkActionId.chooseAction;
  public BulkActionEnum = BulkActionId;
  public bulkActions: BulkAction[] = [];
  public applyBtnDisabled = true;
  public submitWarning: Observable<string>;
  public selectAllCheckboxVisible = false;
  public selectAllChecked = false;

  public tableFilterType = TableFilterType;

  public canViewPersonalData: boolean;
  public canUpdateRegistrationAttributeFinancial: boolean;
  private canViewMessageHistory: boolean;
  private canUpdatePaData: boolean;
  private canUpdatePaFsp: boolean;
  private canUpdatePersonalData: boolean;
  private canViewPaymentData: boolean;
  private canViewVouchers: boolean;
  private canDoSinglePayment: boolean;

  private routerSubscription: Subscription;
  private pubSubSubscription: Subscription;
  private textFilterSubscription: Subscription;
  private statusFilterSubscription: Subscription;
  private combinedFilterSubscription: Subscription;

  public isStatusFilterPopoverOpen = false;
  public tableFilters = [
    {
      prop: 'paStatus',
      type: this.tableFilterType.multipleChoice,
      description: 'multiple-choice-hidden-options',
    },
  ];

  public tableFiltersPerColumn: Filter[] = [];
  private tableTextFilter: PaginationFilter[] = [];
  public columnsPerPhase: PaTableAttribute[];

  private tableStatusFilter: RegistrationStatus[];

  private messageColumnStatus = MessageStatusMapping;
  public pageMetaData: PaginationMetadata;
  public messageTemplates: MessageTemplate[];

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    public translate: TranslateService,
    private bulkActionService: BulkActionsService,
    private pastPaymentsService: PastPaymentsService,
    private alertController: AlertController,
    public modalController: ModalController,
    public popoverController: PopoverController,
    private pubSub: PubSubService,
    private router: Router,
    private translatableStringService: TranslatableStringService,
    private errorHandlerService: ErrorHandlerService,
    private enumService: EnumService,
    private registrationsService: RegistrationsService,
    private filterService: FilterService,
    private tableService: TableService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;

    this.registrationsService?.setCurrentPage(0);
    this.registrationsService?.setItemsPerPage(12);

    this.pageMetaData = this.registrationsService?.getPageMetadata();

    this.columnDefaults = this.tableService.getColumnDefaults();
  }

  public ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.pubSubSubscription) {
      this.pubSubSubscription.unsubscribe();
    }
    if (this.textFilterSubscription) {
      this.textFilterSubscription.unsubscribe();
    }
    if (this.statusFilterSubscription) {
      this.statusFilterSubscription.unsubscribe();
    }
    if (this.combinedFilterSubscription) {
      this.combinedFilterSubscription.unsubscribe();
    }
  }

  private setupFilterSubscriptions() {
    this.textFilterSubscription = this.filterService.textFilter$.subscribe(
      (value) => {
        this.tableTextFilter = value;
      },
    );
    this.statusFilterSubscription = this.filterService.statusFilter$.subscribe(
      (value) => {
        this.tableStatusFilter = value;
      },
    );

    this.combinedFilterSubscription = this.filterService.textFilter$
      .pipe(mergeWith(this.filterService.statusFilter$))
      .pipe(
        throttleTime(500, null, {
          leading: false,
          trailing: true,
        }),
      )
      .subscribe(() => {
        this.setPage({
          // Front-end already resets to page 1 automatically. This makes sure that also API-call is reset to page 1.
          offset: 0,
        });
        this.refreshData();
      });
  }

  async initComponent() {
    this.isLoading = true;

    this.tableFilterRow.initComponent();

    this.columns = [];

    await this.loadProgram();

    await this.loadPermissions();

    this.paTableAttributes = await this.programsService.getPaTableAttributes(
      this.programId,
      { phase: this.thisPhase },
    );

    this.activePhase = this.program.phase;

    this.columns = await this.tableService.loadColumns(
      this.thisPhase,
      this.program,
      this.canViewPersonalData,
    );

    if (this.canViewPaymentData && this.thisPhase === ProgramPhase.payment) {
      this.paymentHistoryColumn =
        this.tableService.createPaymentHistoryColumn();
    }

    this.setupFilterSubscriptions();

    this.messageTemplates =
      await this.programsService.getMessageTemplatesByProgram(this.programId);

    await this.updateBulkActions();

    this.tableFiltersPerColumn = this.createFilterPerAttibute();
    this.filterService.setAllAvailableFilters(this.tableFiltersPerColumn);

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

    this.submitWarning = this.bulkActionService.submitBulkActionWarning$;

    this.updateProxyScrollbarSize();

    this.isCompleted.emit(true);
  }

  private async refreshData() {
    this.isLoading = true;
    await this.loadData();
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
    this.canUpdatePaFsp = this.authService.hasAllPermissions(this.programId, [
      Permission.RegistrationFspUPDATE,
    ]);
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalREAD],
    );
    this.canUpdateRegistrationAttributeFinancial =
      this.authService.hasAllPermissions(this.programId, [
        Permission.RegistrationAttributeFinancialUPDATE,
      ]);
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

  private checkValidationColumnOrAction(columnOrAction) {
    return (
      (columnOrAction.showIfNoValidation && !this.program.validation) ||
      this.program.validation
    );
  }

  private async updateBulkActions() {
    const notPaymentBulkActions = this.bulkActionService.getBulkActions();
    const paymentBulkActions = await this.getPaymentBulkActions();
    const unfilteredBulkAction = [
      ...notPaymentBulkActions,
      ...paymentBulkActions,
    ];
    this.bulkActions = unfilteredBulkAction.map((action) => {
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

  private getLabelForAttribute(attributeName: string): string {
    const paAttribute = this.program.paTableAttributes.find(
      (attribute) => attribute.name === attributeName,
    );

    if (paAttribute && paAttribute.shortLabel) {
      return this.translatableStringService.get(paAttribute.shortLabel);
    }

    const availableTranslations = this.translate.instant(
      'page.program.program-people-affected.column',
    );

    if (availableTranslations[attributeName]) {
      return availableTranslations[attributeName];
    }

    return attributeName;
  }

  private createFilterPerAttibute(): Filter[] {
    const allFilters = [];
    let groupIndex = 0;
    for (const group of this.program.filterableAttributes) {
      for (const columnName of group.filters) {
        if (
          columnName.name === 'inclusionScore' &&
          !this.showInclusionScore()
        ) {
          continue;
        }

        allFilters.push({
          name: columnName.name,
          label: this.getLabelForAttribute(columnName.name),
          allowedOperators: columnName.allowedOperators,
          isInteger: columnName.isInteger,
        });
      }

      // add divider line after each group except last
      if (groupIndex < this.program.filterableAttributes.length - 1) {
        allFilters.push({
          name: 'divider',
          label: '-',
          disabled: true,
        });
      }
      groupIndex += 1;
    }

    return allFilters;
  }

  private async getPaymentBulkActions(): Promise<BulkAction[]> {
    // Add buaddPaymentBulkActionslk-action for 1st upcoming payment & past 5 payments
    // Note, the number 5 is the same as allowed for the single payment as set in payment-history-popup.component
    const nextPaymentId = await this.pastPaymentsService.getNextPaymentId(
      this.program,
    );
    const paymentId = nextPaymentId || this.program.distributionDuration;

    return this.bulkActionService.generatePaymentBulkActions(
      paymentId,
      nextPaymentId,
    );
  }

  public hasEnabledActions(): boolean {
    const enabledActions = this.bulkActions.filter((a) => a.enabled);
    return enabledActions.length > 0;
  }

  private async loadData() {
    this.setPage({
      offset: this.registrationsService?.getPageMetadata().currentPage,
    });
  }

  private createTableData(source: Person[]): PersonRow[] {
    if (!source || source.length === 0) {
      return [];
    }
    return source.map((person) => this.createPersonRow(person));
  }

  private createPersonRow(person: Person): PersonRow {
    let personRow: PersonRow = {
      id: person.registrationProgramId,
      referenceId: person.referenceId,
      checkboxVisible: false,
      registrationProgramId: person.personAffectedSequence,
      registrationStatus: person.status,
      status: this.translate.instant(
        'page.program.program-people-affected.status.' + person.status,
      ),
      registrationCreated: person.registrationCreated
        ? formatDate(
            person.registrationCreated,
            DateFormat.dayAndTime,
            this.locale,
          )
        : null,
      inclusionScore: person.inclusionScore,
      preferredLanguage: person.preferredLanguage
        ? this.enumService.getEnumLabel(
            'preferredLanguage',
            person.preferredLanguage,
          )
        : '',
      phoneNumber: formatPhoneNumber(person.phoneNumber),
      paymentAmountMultiplier: person.paymentAmountMultiplier
        ? `${person.paymentAmountMultiplier}×`
        : '',
      paymentCountRemaining: person.paymentCountRemaining,
      maxPayments: person.maxPayments
        ? `${person.maxPayments} ${
            [ProgramPhase.inclusion, ProgramPhase.payment].includes(
              this.thisPhase,
            )
              ? `(${
                  person.maxPayments - person.paymentCount
                } ${this.translate.instant(
                  'page.program.program-people-affected.max-payments.left',
                )})`
              : ''
          }`
        : '',
      fsp: person.financialServiceProvider,
      financialServiceProvider: person.fspDisplayNamePortal,
      lastMessageStatus: person.lastMessageStatus,
      hasNote: !!person.note,
    };

    if (this.canViewPaymentData) {
      personRow = this.fillPaymentHistoryColumn(personRow);
    }

    // Custom attributes can be personal data or not personal data
    // for now only users that view custom data can see it
    if (this.canViewPersonalData) {
      personRow = this.fillPaTableAttributeRows(person, personRow);
      personRow = this.fillNameColumns(person, personRow);
    }

    return personRow;
  }

  private fillPaTableAttributeRows(
    person: Person,
    personRow: PersonRow,
  ): PersonRow {
    for (const paTableAttribute of this.paTableAttributes) {
      let value = person[paTableAttribute.name];
      if (value === 'true') {
        value = true;
      }
      if (value === 'false') {
        value = false;
      }
      if (paTableAttribute.type === AnswerType.PhoneNumber) {
        value = formatPhoneNumber(value);
      }
      personRow[paTableAttribute.name] = value;
    }
    return personRow;
  }

  private fillNameColumns(person: Person, personRow: PersonRow): PersonRow {
    for (const key of this.program.fullnameNamingConvention) {
      const value = person[key];
      personRow[key] = value;
    }
    return personRow;
  }

  private fillPaymentHistoryColumn(personRow: PersonRow): PersonRow {
    const columnKey = 'paymentHistoryColumn';
    personRow[columnKey] = this.translate.instant(
      'page.program.program-people-affected.transaction.payments-popup',
    );
    return personRow;
  }

  public showInclusionScore(): boolean {
    let show = false;
    for (const pa of this.visiblePeopleAffected) {
      show = !!pa.inclusionScore;
      if (show) {
        break;
      }
    }
    return show;
  }

  public async editPersonAffectedPopup(row: PersonRow, programId: number) {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: EditPersonAffectedPopupComponent,
      componentProps: {
        programId,
        referenceId: row.referenceId,
        canUpdatePaData: this.canUpdatePaData,
        canViewPersonalData: this.canViewPersonalData,
        canUpdateRegistrationAttributeFinancial:
          this.canUpdateRegistrationAttributeFinancial,
        canUpdatePersonalData: this.canUpdatePersonalData,
        canUpdatePaFsp: this.canUpdatePaFsp,
        canViewMessageHistory: this.canViewMessageHistory,
        canViewPaymentData: this.canViewPaymentData,
      },
    });

    await modal.present();
  }

  public async paymentHistoryPopup(personRow: PersonRow) {
    const person = this.visiblePeopleAffected.find(
      (pa) => pa.referenceId === personRow.referenceId,
    );
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: PaymentHistoryPopupComponent,
      componentProps: {
        referenceId: person.referenceId,
        program: this.program,
        canViewPersonalData: this.canViewPersonalData,
        canViewPaymentData: this.canViewPaymentData,
        canViewVouchers: this.canViewVouchers,
        canDoSinglePayment: this.canDoSinglePayment,
      },
    });
    await modal.present();
  }

  public async openMessageHistoryPopup(
    personRow: PersonRow,
    programId: number,
  ) {
    const referenceId = personRow.referenceId;
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: MessageHistoryPopupComponent,
      componentProps: {
        referenceId,
        programId,
      },
    });
    await modal.present();
  }

  public async selectAction($event) {
    if (this.action === BulkActionId.chooseAction) {
      this.resetBulkAction();
      this.bulkActionService.updateSubmitBulkActionWarningAction(null);
      return;
    }

    if (this.action === BulkActionId.doPayment) {
      const dropdownOptionLabel =
        $event.target.options[$event.target.options.selectedIndex].text;
      this.submitPaymentProps.payment = Number(
        dropdownOptionLabel.split('#')[1],
      );
    } else {
      this.submitPaymentProps.payment = null;
    }

    await this.updatePeopleForAction(this.visiblePeopleAffected);

    // Change the selected people count when select all is active and the bulk actions changes
    if (this.selectAllChecked) {
      this.toggleDisableAllCheckboxes();
      this.updatePeopleForAction(this.visiblePeopleAffected);
      this.applyAction(null, true);
    } else {
      this.selectedPeople = [];
      this.selectedCount = 0;
    }

    this.bulkActionService.updateSubmitBulkActionWarningAction(
      this.bulkActions.find((a) => a.id === this.action),
    );

    this.selectAllCheckboxVisible = true;
  }

  private toggleDisableAllCheckboxes(): void {
    this.visiblePeopleAffected.forEach((person) => {
      person.checkboxDisabled = this.selectAllChecked ? true : false;
    });
  }

  private async updatePeopleForAction(people: PersonRow[]): Promise<void> {
    for await (const person of people) {
      let customBulkActionInput: CustomBulkActionInput = {
        referenceId: person.referenceId,
      };
      if (this.action === BulkActionId.doPayment) {
        customBulkActionInput = {
          ...customBulkActionInput,
          ...this.getDryRunPaymentCustomBulkActionInput(),
        };
      }
      this.applyAction(customBulkActionInput, true);
    }
    return;
  }

  private async resetBulkAction() {
    this.isInProgress = true;
    this.action = BulkActionId.chooseAction;
    this.applyBtnDisabled = true;
    this.selectAllCheckboxVisible = false;
    this.selectAllChecked = false;

    this.selectedPeople = [];
    this.selectedCount = 0;
    this.isInProgress = false;
  }

  public onSelect(selected: PersonRow[]) {
    let customBulkActionInput: CustomBulkActionInput = null;
    if (this.action === BulkActionId.doPayment) {
      customBulkActionInput = this.getDryRunPaymentCustomBulkActionInput();

      this.submitPaymentProps.referenceIds = selected.map((p) => p.referenceId);
    }

    if (selected.length) {
      this.applyAction(customBulkActionInput, true);
      this.applyBtnDisabled = false;
    } else {
      this.selectedCount = 0;
      this.applyBtnDisabled = true;
    }
  }

  public onSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;
    if (this.selectAllChecked) {
      this.handleSelectAllChecked();
    } else {
      this.handleSelectAllUnchecked();
    }
  }

  private async handleSelectAllChecked(): Promise<void> {
    this.selectedPeople = [];

    let customBulkActionInput: CustomBulkActionInput = null;
    if (this.action === BulkActionId.doPayment) {
      customBulkActionInput = this.getDryRunPaymentCustomBulkActionInput();
      this.submitPaymentProps.referenceIds = [];
    }
    this.toggleDisableAllCheckboxes();
    this.applyAction(customBulkActionInput, true);
    this.applyBtnDisabled = false;
  }

  private async handleSelectAllUnchecked() {
    this.selectedCount = this.selectedPeople.length;
    this.toggleDisableAllCheckboxes();
    this.applyBtnDisabled = true;
  }

  public isRowSelected(rowId: string): boolean {
    if (this.selectAllChecked) {
      return true;
    } else {
      return this.selectedPeople.map((p) => p.referenceId).includes(rowId);
    }
  }

  public getCurrentBulkAction(): BulkAction {
    const action = this.bulkActions.find(
      (i: BulkAction) => i.id === this.action,
    );
    let messageTemplate: MessageTemplate = null;

    if (action) {
      const mappedAction = BulkActionRegistrationStatusMap[action.id];
      messageTemplate = this.messageTemplates?.find(
        (template) =>
          template.type === mappedAction && template.language == 'en',
      );

      if (messageTemplate) {
        action.confirmConditions.isTemplated = true;
        action.confirmConditions.explanation = this.translate.instant(
          'page.program.program-people-affected.action-inputs.templated-explanation',
        );
        action.confirmConditions.templatedMessage = messageTemplate.message;
        action.confirmConditions.messageTemplateKey = messageTemplate.type;
        action.confirmConditions.supportMessage = this.translate.instant(
          'page.program.program-people-affected.action-inputs.templated-support',
        );
        action.confirmConditions.inputRequired = false;
        action.confirmConditions.checkboxChecked = true;
      } else {
        action.confirmConditions.previewReferenceId = this.selectAllChecked
          ? this.visiblePeopleAffected[0]?.referenceId
          : this.selectedPeople[0]?.referenceId;
      }
      action.confirmConditions.programId = this.programId;
    }
    return action;
  }

  private updateSubmitWarning(
    applicableCount: number,
    nonApplicableCount: number,
  ) {
    this.bulkActionService.updateSubmitBulkActionWarningCount(
      applicableCount,
      nonApplicableCount,
    );
  }

  private setBulkActionFilters(referenceId?: string): PaginationFilter[] {
    let filters: PaginationFilter[];
    if (referenceId) {
      // This is the case where you check per row to show a checkbox or not
      filters = [
        {
          value: referenceId,
          name: 'referenceId',
          label: 'referenceId',
          operator: FilterOperatorEnum.eq,
        },
      ];
    } else if (this.selectedPeople.length) {
      // This is individual checkbox selection > overrides any applied filters
      filters = [
        {
          value: this.selectedPeople.map((p) => p.referenceId).join(','),
          name: 'referenceId',
          label: 'referenceId',
          operator: FilterOperatorEnum.in,
        },
      ];
    } else {
      // This is 'select all' > pass on applied filters
      filters = [
        ...this.tableTextFilter,
        ...[
          {
            name: 'status',
            label: 'status',
            value: this.tableStatusFilter.join(','),
            operator: FilterOperatorEnum.in,
          },
        ],
      ];
    }
    return filters;
  }

  public async applyAction(
    customBulkActionInput?: CustomBulkActionInput,
    dryRun = false,
  ) {
    this.isInProgress = true;

    const filters = this.setBulkActionFilters(
      customBulkActionInput?.referenceId,
    );
    this.bulkActionService
      .applyAction(
        this.action,
        this.programId,
        customBulkActionInput,
        dryRun,
        filters,
      )
      .then(async (response) => {
        const bulkActionResult = response as BulkActionResult;
        if (dryRun) {
          this.handleBulkActionDryRunResult(
            bulkActionResult,
            customBulkActionInput?.referenceId,
          );
        } else {
          this.handleBulkActionResult(bulkActionResult);
        }
        this.isInProgress = false;
      })
      .catch((error) => {
        console.log('Error:', error);
        let err = error;
        if (error.error?.error) {
          err = error.error?.error;
        }
        actionResult(
          this.alertController,
          this.translate,
          err,
          true,
          PubSubEvent.dataRegistrationChanged,
          this.pubSub,
        );
      });
  }

  private handleBulkActionDryRunResult(
    bulkActionResult: BulkActionResult,
    referenceId?: string,
  ) {
    if (referenceId) {
      // if referenceId is passed, this is only about showing row checkboxes or not
      this.visiblePeopleAffected.find(
        (p) => p.referenceId === referenceId,
      ).checkboxVisible = bulkActionResult?.applicableCount > 0;
      return;
    }

    if (this.action === BulkActionId.doPayment) {
      this.submitPaymentProps.applicableCount =
        bulkActionResult.applicableCount;
      this.submitPaymentProps.sumPaymentAmountMultiplier =
        bulkActionResult.sumPaymentAmountMultiplier;
    }

    this.updateSubmitWarning(
      bulkActionResult.applicableCount,
      bulkActionResult.nonApplicableCount,
    );
    this.selectedCount = bulkActionResult.applicableCount;
    if (bulkActionResult.applicableCount === 0) {
      const nobodyToSelectTest = this.translate.instant(
        'page.program.program-people-affected.no-checkboxes',
      );
      const conditionsToSelectText = this.translate.instant(
        `page.program.program-people-affected.bulk-action-conditions.${this.action}`,
        { action: this.getCurrentBulkAction().label },
      );

      const text = `${nobodyToSelectTest}\n${conditionsToSelectText}`;

      this.resetBulkAction();
      actionResult(
        this.alertController,
        this.translate,
        text,
        true,
        PubSubEvent.dataRegistrationChanged,
        this.pubSub,
      );
    }
    return;
  }

  private async handleBulkActionResult(bulkActionResult: BulkActionResult) {
    const statusRelatedBulkActions = [
      BulkActionId.invite,
      BulkActionId.selectForValidation,
      BulkActionId.include,
      BulkActionId.endInclusion,
      BulkActionId.reject,
      BulkActionId.markNoLongerEligible,
      BulkActionId.pause,
    ];
    const responseText = this.translate.instant(
      'page.program.program-people-affected.bulk-action-response.response',
      {
        action: this.getCurrentBulkAction().label,
        paNumber: bulkActionResult.applicableCount,
      },
    );

    const paMovedPhaseText = statusRelatedBulkActions.includes(this.action)
      ? this.translate.instant(
          'page.program.program-people-affected.bulk-action-response.pa-moved-phase',
        )
      : '';
    const closePopupText = this.translate.instant(
      'page.program.program-people-affected.bulk-action-response.close-popup',
    );

    const bulkActionResponse = `<p>${responseText}</p><p>${paMovedPhaseText}</p><p>${closePopupText}</p>`;

    await actionResult(
      this.alertController,
      this.translate,
      bulkActionResponse,
      true,
      PubSubEvent.dataRegistrationChanged,
      this.pubSub,
    );
    this.resetBulkAction();
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
          actionResult(
            this.alertController,
            this.translate,
            this.translate.instant('common.update-success'),
            true,
            PubSubEvent.dataRegistrationChanged,
            this.pubSub,
          );
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
            actionResult(
              this.alertController,
              this.translate,
              errorMessage,
              true,
              PubSubEvent.dataRegistrationChanged,
              this.pubSub,
            );
          }
        },
      );
  }

  public hasMessageError(messageStatus): boolean {
    return this.messageColumnStatus[messageStatus] === MessageStatus.failed;
  }

  public async setPage(pageInfo: {
    offset: number;
    count?: number;
    pageSize?: number;
    limit?: number;
  }) {
    this.isLoading = true;
    this.registrationsService?.setCurrentPage(pageInfo.offset);

    await this.getPage();

    this.isLoading = false;
  }

  private async getPage(): Promise<void> {
    const { data, meta } = await this.registrationsService.getPage(
      this.programId,
      null,
      null,
      null,
      this.tableStatusFilter,
      this.tableTextFilter,
    );

    this.visiblePeopleAffected = this.createTableData(data);
    this.toggleDisableAllCheckboxes();
    await this.updatePeopleForAction(this.visiblePeopleAffected);

    this.registrationsService?.setTotalItems(meta.totalItems);
    this.registrationsService?.setCurrentPage(meta.currentPage - 1);

    this.updateProxyScrollbarSize();
  }

  public async onSort(event: {
    sorts: {
      dir: SortDirection;
      prop: string;
    }[];
    column: '';
    prevValue: '';
    newvalue: '';
  }) {
    this.registrationsService?.setSortBy(
      event.sorts[0].prop,
      event.sorts[0].dir,
    );

    this.setPage({
      // Front-end already resets to page 1 automatically. This makes sure that also API-call is reset to page 1.
      offset: 0,
    });
  }

  private getDryRunPaymentCustomBulkActionInput(): CustomBulkActionInput {
    return {
      payment: this.submitPaymentProps.payment,
      paymentAmount: null, // Not sending the amount makes the API call faster
    };
  }
}
