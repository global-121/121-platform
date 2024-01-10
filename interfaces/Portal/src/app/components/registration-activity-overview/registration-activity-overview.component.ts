import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { PaymentData, PaymentRowDetail } from 'src/app/models/payment.model';
import { Program } from 'src/app/models/program.model';
import { StatusEnum } from 'src/app/models/status.enum';
import { Transaction } from 'src/app/models/transaction.model';
import { PaymentHistoryAccordionComponent } from 'src/app/program/payment-history-accordion/payment-history-accordion.component';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Attribute } from '../../models/attribute.model';
import { AnswerType } from '../../models/fsp.model';
import { Person } from '../../models/person.model';
import { RegistrationStatusChange } from '../../models/registration-status-change.model';
import { EnumService } from '../../services/enum.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';
import { AddNotePopupComponent } from '../add-note-popup/add-note-popup.component';

class ActivityOverviewItem {
  type: string;
  label?: string;
  date: Date;
  paymentRowDetail?: PaymentRowDetail;
  description?: string;
  hasVoucherSupport?: boolean;
  person?: Person;
  program?: Program;
  hasError?: boolean;
  hasWaiting?: boolean;
  chipText?: string;
  subLabel?: string;
}

enum ActivityOverviewType {
  dataChanges = 'dataChanges',
  payment = 'payment',
  message = 'message',
  notes = 'notes',
  status = 'status',
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    PaymentHistoryAccordionComponent,
    AddNotePopupComponent,
  ],
  selector: 'app-registration-activity-overview',
  templateUrl: './registration-activity-overview.component.html',
  styleUrls: ['./registration-activity-overview.component.scss'],
})
export class RegistrationActivityOverviewComponent implements OnInit {
  @Input()
  private program: Program;

  @Input()
  private person: Person;

  @Input()
  public canViewVouchers = false;

  @Input()
  public statusChanges: RegistrationStatusChange[];

  public DateFormat = DateFormat;
  public firstPaymentToShow = 1;
  public activityOverview: ActivityOverviewItem[];
  public activityOverviewFilter: string = null;
  public activityOverviewButtons = [
    null,
    ActivityOverviewType.payment,
    ActivityOverviewType.notes,
    ActivityOverviewType.message,
    ActivityOverviewType.dataChanges,
    ActivityOverviewType.status,
  ];
  public canUpdatePersonalData: boolean;

  private canViewRegistration: boolean;
  private canViewPersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canViewPaymentData: boolean;
  private canDoSinglePayment: boolean;
  private lastPaymentId: number;
  private pastTransactions: Transaction[] = [];
  private pastPayments: PaymentData[];

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private authService: AuthService,
    private pastPaymentsService: PastPaymentsService,
    private translatableString: TranslatableStringService,
    private enumService: EnumService,
    private modalController: ModalController,
  ) {}

  async ngOnInit() {
    if (!this.person || !this.program.id || !this.person.referenceId) {
      return;
    }

    this.loadPermissions();
    this.canDoSinglePayment = this.authService.hasAllPermissions(
      this.program.id,
      [
        Permission.ActionREAD,
        Permission.PaymentCREATE,
        Permission.PaymentREAD,
        Permission.PaymentTransactionREAD,
      ],
    );
    if (this.canViewPaymentData) {
      this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
        this.program.id,
      );
      this.pastTransactions = await this.programsService.getTransactions(
        this.program.id,
        this.person?.referenceId,
      );
      this.pastPayments = await this.programsService.getPastPayments(
        this.program.id,
      );
    }
    this.fillActivityOverview();
    this.activityOverview.reverse();
  }

  public getFilteredActivityOverview(): ActivityOverviewItem[] {
    if (!this.activityOverviewFilter) {
      return this.activityOverview;
    }
    return this.activityOverview.filter(
      (item) => item.type === this.activityOverviewFilter,
    );
  }

  public getFilterCount(filter: string | null): number {
    if (!this.activityOverview) {
      return 0;
    }
    if (!filter) {
      return this.activityOverview.length;
    }
    return this.activityOverview.filter((item) => item.type === filter).length;
  }

  public hasError(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.hasError(paymentRow);
  }

  public hasWaiting(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.hasWaiting(paymentRow);
  }

  public hasVoucherSupport(fsp: string): boolean {
    return PaymentUtils.hasVoucherSupport(fsp);
  }

  public enableSinglePayment(paymentRow: PaymentRowDetail): boolean {
    return PaymentUtils.enableSinglePayment(
      paymentRow,
      this.canDoSinglePayment,
      this.person.status,
      this.lastPaymentId,
      false,
    );
  }

  private fillPaymentRows(): PaymentRowDetail[] {
    const paymentRows = [];
    const nrOfPayments = this.program?.distributionDuration;
    const lastPaymentToShow = Math.min(this.lastPaymentId, nrOfPayments);
    for (
      let index = this.firstPaymentToShow;
      index <= lastPaymentToShow;
      index++
    ) {
      const transaction = PaymentUtils.getTransactionOfPaymentForRegistration(
        index,
        this.person.referenceId,
        this.pastTransactions,
      );
      let paymentRowValue: PaymentRowDetail = {
        paymentIndex: index,
        text: '',
      };
      if (!transaction) {
        paymentRowValue.text = this.translate.instant(
          'page.program.program-people-affected.transaction.do-single-payment',
        );
        const dateOfCompletePayment = this.pastPayments.find(
          (pastP) => pastP.id === paymentRowValue.paymentIndex,
        )?.paymentDate;
        paymentRowValue.sentDate = dateOfCompletePayment
          ? dateOfCompletePayment.toISOString()
          : null;
      } else {
        paymentRowValue = PaymentUtils.getPaymentRowInfo(
          transaction,
          this.program,
          index,
        );
        if (transaction.status === StatusEnum.success) {
          /* empty */
        } else if (transaction.status === StatusEnum.waiting) {
          paymentRowValue.errorMessage = this.translate.instant(
            'page.program.program-people-affected.transaction.waiting-message',
          );
          paymentRowValue.waiting = true;
        } else {
          paymentRowValue.errorMessage = transaction.errorMessage;
        }

        paymentRowValue.status = transaction.status;
      }
      if (
        paymentRowValue.transaction ||
        PaymentUtils.enableSinglePayment(
          paymentRowValue,
          false,
          this.person.status,
          this.lastPaymentId,
          false,
        )
      ) {
        paymentRows.push(paymentRowValue);
      }
    }
    return paymentRows;
  }

  private async fillActivityOverview() {
    this.activityOverview = [];
    if (this.canViewPaymentData) {
      const tempData: ActivityOverviewItem[] = [];
      this.fillPaymentRows().forEach((v) => {
        tempData.push({
          paymentRowDetail: { ...v },
          type: ActivityOverviewType.payment,
          date: new Date(v.sentDate),
        });
      });
      this.activityOverview = [...tempData];
      this.activityOverview.reverse();
    }

    if (this.canViewMessageHistory) {
      const messageHistory = await this.programsService.retrieveMsgHistory(
        this.program.id,
        this.person.referenceId,
      );

      for (const message of messageHistory) {
        this.activityOverview.push({
          type: ActivityOverviewType.message,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.message.label',
          ),
          date: new Date(message.created),
          description: message.body,
        });
      }
    }

    if (this.canViewRegistration) {
      for (const statusChange of this.statusChanges) {
        this.activityOverview.push({
          type: ActivityOverviewType.status,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.status.label',
          ),
          date: new Date(statusChange.date),
          description: this.translate.instant(
            'registration-details.activity-overview.activities.status.description',
            {
              status: this.translate.instant(
                'page.program.program-people-affected.status.' +
                  statusChange.status,
              ),
            },
          ),
        });
      }
    }

    if (this.canViewPersonalData) {
      const changes =
        await this.programsService.getRegistrationChangeLogByReferenceId(
          this.program.id,
          this.person.referenceId,
        );

      for (const change of changes) {
        const paTableAttributes = this.program.paTableAttributes || [];
        const attribute = paTableAttributes.find(
          (attr) => attr.name === change.fieldName,
        );

        const booleanLabel = {
          true: 'Yes',
          false: 'No',
        };

        let oldValue = change.oldValue ? change.oldValue : '-';
        let newValue = change.newValue ? change.newValue : '-';

        if (attribute?.type === AnswerType.Boolean) {
          oldValue = booleanLabel[oldValue];
          newValue = booleanLabel[newValue];
        }

        if (this.enumService.isEnumerableAttribute(change.fieldName)) {
          oldValue = this.enumService.getEnumLabel(change.fieldName, oldValue);
          newValue = this.enumService.getEnumLabel(change.fieldName, newValue);
        }

        let description = this.translate.instant(
          'registration-details.activity-overview.activities.data-changes.values',
          {
            oldValue: oldValue,
            newValue: newValue,
          },
        );
        if (change.reason) {
          description += this.translate.instant(
            'registration-details.activity-overview.activities.data-changes.reason',
            {
              reason: change.reason,
            },
          );
        }
        this.activityOverview.push({
          type: ActivityOverviewType.dataChanges,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.data-changes.label',
          ),
          subLabel: this.getSubLabelText(change, attribute),
          date: new Date(change.created),
          description,
          chipText: change.user.username,
        });
      }

      const notes = await this.programsService.getNotes(
        this.program.id,
        this.person.referenceId,
      );
      for (const note of notes) {
        this.activityOverview.push({
          type: ActivityOverviewType.notes,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.note.label',
          ),
          date: new Date(note.created),
          description: note.text,
          chipText: note.username,
        });
      }
    }

    this.activityOverview.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  private getSubLabelText(change: any, attribute: Attribute): string {
    const translationKey = `page.program.program-people-affected.column.${change.fieldName}`;
    const translation = this.translate.instant(translationKey);
    return attribute?.shortLabel
      ? this.translatableString.get(attribute.shortLabel)
      : translation !== translationKey
        ? translation
        : change.fieldName;
  }

  public getIconName(type: ActivityOverviewType): string {
    const map = {
      [ActivityOverviewType.message]: 'mail-outline',
      [ActivityOverviewType.dataChanges]: 'document-text-outline',
      [ActivityOverviewType.payment]: 'cash-outline',
      [ActivityOverviewType.status]: 'reload-circle-outline',
      [ActivityOverviewType.notes]: 'clipboard-outline',
    };
    return map[type];
  }

  private loadPermissions() {
    this.canViewRegistration = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationREAD],
    );
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationPersonalREAD],
    );
    this.canUpdatePersonalData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationPersonalUPDATE],
    );
    this.canViewMessageHistory = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationNotificationREAD],
    );
    this.canViewPaymentData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );
    this.canDoSinglePayment = this.authService.hasAllPermissions(
      this.program.id,
      [
        Permission.ActionREAD,
        Permission.PaymentCREATE,
        Permission.PaymentREAD,
        Permission.PaymentTransactionREAD,
      ],
    );
    this.canViewVouchers = this.authService.hasAllPermissions(this.program.id, [
      Permission.PaymentVoucherREAD,
    ]);
  }

  async openAddNoteModal() {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: AddNotePopupComponent,
      componentProps: {
        programId: this.program.id,
        referenceId: this.person?.referenceId,
        name: this.person?.name,
      },
    });

    await modal.present();
  }
}
