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
import { NavigationEnd, Router } from '@angular/router';
import {
  AlertController,
  ModalController,
  Platform,
  PopoverController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { SortDirection } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { BulkAction, BulkActionId } from 'src/app/models/bulk-actions.models';
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
import { BulkActionsService } from 'src/app/services/bulk-actions.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PubSubEvent, PubSubService } from 'src/app/services/pub-sub.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { formatPhoneNumber } from 'src/app/shared/format-phone-number';
import { environment } from 'src/environments/environment';
import { MessageHistoryPopupComponent } from '../../components/message-history-popup/message-history-popup.component';
import RegistrationStatus from '../../enums/registration-status.enum';
import {
  MessageStatus,
  MessageStatusMapping,
} from '../../models/message.model';
import { PaginationMetadata } from '../../models/pagination-metadata.model';
import { EnumService } from '../../services/enum.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import {
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

@Component({
  selector: 'app-program-people-affected',
  templateUrl: './program-people-affected.component.html',
  styleUrls: ['./program-people-affected.component.scss'],
})
export class ProgramPeopleAffectedComponent implements OnDestroy {
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
  private paTableAttributes: PaTableAttribute[] = [];
  public activePhase: ProgramPhase;

  private locale: string;

  public isLoading: boolean;

  public columnDefaults: any;
  public columns: PersonTableColumn[] = [];
  public paymentHistoryColumn: PersonTableColumn;

  public selectedPeople: PersonRow[] = [];
  public visiblePeopleAffected: PersonRow[] = [];

  public isInProgress = false;

  public submitPaymentProps: SubmitPaymentProps;
  public emptySeparatorWidth = 40;

  public action: BulkActionId = BulkActionId.chooseAction;
  public BulkActionEnum = BulkActionId;
  public bulkActions: BulkAction[] = [];
  public applyBtnDisabled = true;
  public submitWarning: any;

  public tableFilterType = TableFilterType;

  public canViewPersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canUpdatePaData: boolean;
  private canUpdatePaFsp: boolean;
  private canUpdatePersonalData: boolean;
  private canViewPaymentData: boolean;
  private canViewVouchers: boolean;
  private canDoSinglePayment: boolean;
  private routerSubscription: Subscription;
  private pubSubSubscription: Subscription;

  public isStatusFilterPopoverOpen = false;
  public tableFilters = [
    {
      prop: 'paStatus',
      type: this.tableFilterType.multipleChoice,
      description: 'multiple-choice-hidden-options',
    },
  ];

  public tableFiltersPerColumn: { name: string; label: string }[] = [];
  public tableTextFilter: PaginationFilter[] = [];
  public columnsPerPhase: PaTableAttribute[];

  private tableStatusFilter: RegistrationStatus[];

  private messageColumnStatus = MessageStatusMapping;
  public pageMetaData: PaginationMetadata;

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
    private enumService: EnumService,
    private registrationsService: RegistrationsService,
    private filterService: FilterService,
    private tableService: TableService,
  ) {
    this.registrationsService?.setCurrentPage(0);
    this.registrationsService?.setItemsPerPage(12);
    this.pageMetaData = this.registrationsService?.getPageMetadata();
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

    this.filterService.getTextFilterSubscription().subscribe(async (filter) => {
      this.tableTextFilter = filter;
      await this.getPage();
    });

    this.filterService
      .getStatusFilterSubscription()
      .subscribe(async (filter) => {
        this.tableStatusFilter = filter;
        await this.getPage();
      });

    this.columnDefaults = this.tableService.getColumnDefaults();
  }
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.pubSubSubscription) {
      this.pubSubSubscription.unsubscribe();
    }
  }

  async initComponent() {
    this.isLoading = true;

    this.columns = [];

    await this.loadProgram();

    await this.loadPermissions();

    this.paTableAttributes = await this.programsService.getPaTableAttributes(
      this.programId,
      this.thisPhase,
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

    await this.refreshData();

    await this.updateBulkActions();

    this.tableFiltersPerColumn = await this.updateTableFiltersPerColumn();

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
    await this.addPaymentBulkActions();

    this.bulkActions = this.bulkActionService.getBulkActions().map((action) => {
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

  private async updateTableFiltersPerColumn(): Promise<
    { name: string; label: string }[]
  > {
    const tableFiltersPerColumn = [];

    for (const columnName of this.program.filterableAttributes) {
      const column = this.program.paTableAttributes.find(
        (column) => column.name === columnName.name,
      );
      let label: string;

      if (column && column.shortLabel) {
        label = this.translatableStringService.get(column.shortLabel);
      } else {
        label = this.translate.instant(
          `page.program.program-people-affected.column.${columnName.name}`,
        );
      }

      tableFiltersPerColumn.push({ name: columnName.name, label: label });

      if (columnName.name === 'successPayment') {
        // TODO: Refactor: this is hard-coded & it assumes that 'successPayment' is the last of the 3 payment variables as defined in programs.service. This should be replaced by a more robust solution.
        tableFiltersPerColumn.push({
          name: 'divider',
          label: '------------------------------------------',
          disabled: true,
        });
      }
    }

    return tableFiltersPerColumn;
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
        person,
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
      return;
    }

    if (this.action === BulkActionId.doPayment) {
      const dropdownOptionLabel =
        $event.target.options[$event.target.options.selectedIndex].text;
      this.submitPaymentProps.payment = Number(
        dropdownOptionLabel.split('#')[1],
      );
    }

    this.visiblePeopleAffected = await this.updatePeopleForAction(
      this.visiblePeopleAffected,
      this.action,
      this.submitPaymentProps.payment,
    );

    this.updateSubmitWarning(this.selectedPeople.length);

    const nrCheckboxes = this.countSelectable(this.visiblePeopleAffected);
    if (nrCheckboxes === 0) {
      this.resetBulkAction();
      actionResult(
        this.alertController,
        this.translate,
        this.translate.instant(
          'page.program.program-people-affected.no-checkboxes',
        ),
        true,
        PubSubEvent.dataRegistrationChanged,
        this.pubSub,
      );
    }
  }

  private async updatePeopleForAction(
    people: PersonRow[],
    action: BulkActionId,
    payment?: number,
  ) {
    let registrationsWithPayment;
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

    this.selectedPeople = [];
    this.isInProgress = false;
  }

  public onSelect(selected: PersonRow[]) {
    this.updateSubmitWarning(selected.length);

    if (this.action === BulkActionId.doPayment) {
      this.submitPaymentProps.referenceIds = selected.map((p) => p.referenceId);
    }

    if (selected.length) {
      this.applyBtnDisabled = false;
    } else {
      this.applyBtnDisabled = true;
    }
  }

  private countSelectable(rows: PersonRow[]) {
    return rows.filter((row) => row.checkboxVisible).length;
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

  private setBulkActionFilters(): PaginationFilter[] {
    let filters: PaginationFilter[];
    if (this.selectedPeople.length) {
      filters = [
        {
          value: this.selectedPeople.map((p) => p.referenceId).join(','),
          name: 'referenceId',
          label: 'referenceId',
          operator: FilterOperatorEnum.in,
        },
      ];
    } else {
      filters = this.tableTextFilter;
    }
    return filters;
  }

  public async applyAction(confirmInput?: string) {
    this.isInProgress = true;

    const dryRun = false;
    const filters = this.setBulkActionFilters();
    this.bulkActionService
      .applyAction(
        this.action,
        this.programId,
        this.selectedPeople,
        {
          message: confirmInput,
        },
        dryRun,
        filters,
      )
      .then(async () => {
        if (
          this.action === BulkActionId.sendMessage ||
          this.action === BulkActionId.deletePa
        ) {
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
          [BulkActionId.pause]: RegistrationStatus.paused,
        };
        if (!actionStatus[this.action]) {
          return;
        }

        await actionResult(
          this.alertController,
          this.translate,
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
          true,
          PubSubEvent.dataRegistrationChanged,
          this.pubSub,
        );
      })
      .catch((error) => {
        console.log('Error:', error);
        actionResult(
          this.alertController,
          this.translate,
          error.error.errors.join('<br><br>'),
          true,
          PubSubEvent.dataRegistrationChanged,
          this.pubSub,
        );
      })
      .finally(() => {
        this.isInProgress = false;
      });
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
}
