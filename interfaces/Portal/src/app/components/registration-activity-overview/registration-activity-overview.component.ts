import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Event } from 'src/app/models/event.model';
import { PaymentRowDetail } from 'src/app/models/payment.model';
import { Program } from 'src/app/models/program.model';
import {
  RegistrationActivity,
  RegistrationActivityType,
} from 'src/app/models/registration-activity.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { RegistrationActivityService } from 'src/app/services/registration-activity.service';
import { PaymentUtils } from 'src/app/shared/payment.utils';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import EventType from '../../enums/event-type.enum';
import { Attribute } from '../../models/attribute.model';
import { AnswerType } from '../../models/fsp.model';
import { Person } from '../../models/person.model';
import { RegistrationActivityDetailAccordionComponent } from '../../program/registration-activity-detail-accordion/registration-activity-detail-accordion.component';
import { EnumService } from '../../services/enum.service';
import { MessagesService } from '../../services/messages.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';
import { AddNotePopupComponent } from '../add-note-popup/add-note-popup.component';
import { RegistrationActivityDetailComponent } from '../registration-activity-detail/registration-activity-detail.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RegistrationActivityDetailAccordionComponent,
    AddNotePopupComponent,
    RegistrationActivityDetailComponent,
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
  public events: Event[];

  public RegistrationActivityType = RegistrationActivityType;

  public locale: string;
  public firstPaymentToShow = 1;
  public activityOverview: RegistrationActivity[];
  public activityOverviewFilter: string | null = null;
  public activityOverviewButtons = [
    null,
    RegistrationActivityType.payment,
    RegistrationActivityType.note,
    RegistrationActivityType.message,
    RegistrationActivityType.changeData,
    RegistrationActivityType.status,
  ];
  public canUpdatePersonalData: boolean;

  private canViewRegistration: boolean;
  private canViewPersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canViewPaymentData: boolean;
  private canDoSinglePayment: boolean;
  private lastPaymentId: number;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private authService: AuthService,
    private pastPaymentsService: PastPaymentsService,
    private translatableString: TranslatableStringService,
    private enumService: EnumService,
    private modalController: ModalController,
    private messagesService: MessagesService,
    private registrationActivityService: RegistrationActivityService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

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
    }
    this.fillActivityOverview();
    this.activityOverview.reverse();
  }

  public getFilteredActivityOverview(): RegistrationActivity[] {
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

  private async fillActivityOverview() {
    this.activityOverview = [];
    if (this.canViewPaymentData) {
      this.activityOverview = [
        ...(await this.pastPaymentsService.getPaymentActivity(
          this.program,
          this.person,
          false,
        )),
      ];
      this.activityOverview.reverse();
    }

    if (this.canViewMessageHistory) {
      const messageHistory = await this.messagesService.getMessageHistory(
        this.program.id,
        this.person.referenceId,
      );

      for (const message of messageHistory) {
        this.activityOverview.push(
          this.registrationActivityService.createMessageActivity(message),
        );
      }
    }

    if (this.canViewPersonalData) {
      for (const change of this.events) {
        let oldValue = change.attributes.oldValue;
        let newValue = change.attributes.newValue;

        let description = {
          oldValue,
          newValue,
          reason: null,
        };

        if (change.type === EventType.registrationDataChange) {
          const paTableAttributes = this.program.paTableAttributes || [];
          const attribute = paTableAttributes.find(
            (attr) => attr.name === change.attributes.fieldName,
          );

          if (attribute?.type === AnswerType.Boolean) {
            const booleanLabel = {
              true: this.translate.instant(
                'page.program.program-people-affected.column.custom-attribute-true',
              ),
              false: this.translate.instant(
                'page.program.program-people-affected.column.custom-attribute-false',
              ),
            };
            oldValue = booleanLabel[oldValue];
            newValue = booleanLabel[newValue];
          }

          if (
            this.enumService.isEnumerableAttribute(change.attributes.fieldName)
          ) {
            oldValue = this.enumService.getEnumLabel(
              change.attributes.fieldName,
              oldValue,
            );
            newValue = this.enumService.getEnumLabel(
              change.attributes.fieldName,
              newValue,
            );
          }

          const reason = change.attributes.reason || null;
          description = {
            oldValue,
            newValue,
            reason,
          };

          this.activityOverview.push({
            type: RegistrationActivityType.changeData,
            label: this.translate.instant(
              'registration-details.activity-overview.activities.data-changes.label',
            ),
            subLabel: this.getSubLabelText(change, attribute),
            date: new Date(change.created),
            description,
            user: change.user ? change.user.username : null,
          });
        }

        if (
          change.type === EventType.registrationStatusChange &&
          this.canViewRegistration
        ) {
          this.activityOverview.push({
            type: RegistrationActivityType.status,
            label: this.translate.instant(
              'registration-details.activity-overview.activities.status.label',
            ),
            date: new Date(change.created),
            description,
            user: change.user ? change.user.username : null,
          });
        }

        if (change.type === EventType.financialServiceProviderChange) {
          if (description.oldValue) {
            try {
              description.oldValue = JSON.parse(description.oldValue);
              description.oldValue = this.translatableString.get(
                description.oldValue,
              );
            } catch (error) {
              description.oldValue = this.translatableString.get(
                description.oldValue,
              );
            }
          }

          if (description.newValue) {
            try {
              description.newValue = JSON.parse(description.newValue);
              description.newValue = this.translatableString.get(
                description.newValue,
              );
            } catch (error) {
              description.newValue = this.translatableString.get(
                description.newValue,
              );
            }
          }

          this.activityOverview.push({
            type: RegistrationActivityType.changeData,
            label: this.translate.instant(
              'registration-details.activity-overview.activities.fsp-change.label',
            ),
            date: new Date(change.created),
            description,
            user: change.user ? change.user.username : null,
          });
        }
      }

      const notes = await this.programsService.getNotes(
        this.program.id,
        this.person.referenceId,
      );
      for (const note of notes) {
        this.activityOverview.push(
          this.registrationActivityService.createNoteActivity(note),
        );
      }
    }

    this.activityOverview.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  private getSubLabelText(change: any, attribute: Attribute): string {
    const translationKey = `page.program.program-people-affected.column.${change.attributes.fieldName}`;
    const translation = this.translate.instant(translationKey);
    return attribute?.label
      ? this.translatableString.get(attribute.label)
      : translation !== translationKey
        ? translation
        : change.attributes.fieldName;
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
