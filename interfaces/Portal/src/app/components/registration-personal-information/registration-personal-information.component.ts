import { CommonModule, formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Event } from 'src/app/models/event.model';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import {
  PaTableAttribute,
  Program,
  ProgramPhase,
} from '../../models/program.model';
import { EditPersonAffectedPopupComponent } from '../../program/edit-person-affected-popup/edit-person-affected-popup.component';
import { EnumService } from '../../services/enum.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';
import { RegistrationPageTableComponent } from '../registration-page-table/registration-page-table.component';

class TableItem {
  label: string;
  value: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RegistrationPageTableComponent,
  ],
  selector: 'app-registration-personal-information',
  templateUrl: './registration-personal-information.component.html',
  styleUrls: ['./registration-personal-information.component.scss'],
})
export class RegistrationPersonalInformationComponent implements OnInit {
  public isDebug = !environment.production;

  @Input()
  public person: Person;

  @Input()
  private program: Program;

  @Input()
  public lastRegistrationStatusChangeEvent: Event;

  public personalInfoTable: TableItem[];
  private tableAttributes: PaTableAttribute[];
  private tableAttributesToShow = [
    'namePartnerOrganization',
    'whatsappPhoneNumber',
  ];

  private canUpdatePaData: boolean;
  private canUpdatePaFsp: boolean;
  private canViewPersonalData: boolean;
  private canUpdateRegistrationAttributeFinancial: boolean;
  private canUpdatePersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canViewPaymentData: boolean;

  private locale: string;

  constructor(
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
    private authService: AuthService,
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private enumService: EnumService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  async ngOnInit() {
    if (!this.person || !this.program.id) {
      return;
    }

    this.loadPermissions();

    this.tableAttributes = await this.programsService.getPaTableAttributes(
      this.program.id,
      { phase: ProgramPhase.registrationValidation },
    );

    if (!this.tableAttributes) {
      return;
    }

    this.fillPersonalInfoTable();
  }

  private getLabel(
    key: string,
    interpolateParams?: { [key: string]: [value: string] },
  ): string {
    const translatePrefix = 'registration-details.personal-information-table.';
    return this.translate.instant(translatePrefix + key, interpolateParams);
  }

  private async fillPersonalInfoTable() {
    this.personalInfoTable = [];

    if (this.person?.status) {
      const statusKey = this.lastRegistrationStatusChangeEvent?.attributes
        ?.newValue
        ? this.lastRegistrationStatusChangeEvent?.attributes?.newValue
        : this.person?.status;
      this.personalInfoTable.push({
        label: this.getLabel('status', {
          status: this.translate.instant(
            `entity.registration.status.${statusKey}`,
          ),
        }),
        value: this.lastRegistrationStatusChangeEvent?.created
          ? formatDate(
              new Date(this.lastRegistrationStatusChangeEvent.created),
              DateFormat.dateOnly,
              this.locale,
            )
          : '',
      });
    }

    if (this.person.preferredLanguage) {
      this.personalInfoTable.push({
        label: this.getLabel('primaryLanguage'),
        value: this.enumService.getEnumLabel(
          'preferredLanguage',
          this.person.preferredLanguage,
        ),
      });
    }

    if (this.canViewPersonalData && this.person.phoneNumber) {
      this.personalInfoTable.push({
        label: this.getLabel('phone'),
        value: !this.person.phoneNumber ? '' : `+${this.person.phoneNumber}`,
      });
    }

    for (const ta of this.tableAttributes) {
      if (!this.tableAttributesToShow.includes(ta.name)) {
        continue;
      }

      const labelToTranslate = ta.label;

      let value = this.person[ta.name];
      if (value === null || value === undefined) {
        continue;
      }
      if (ta.type === 'tel') {
        value = value === '' ? value : `+${value}`;
      }

      this.personalInfoTable.push({
        label: this.translatableString.get(labelToTranslate),
        value,
      });
    }

    if (
      this.person.financialServiceProvider &&
      this.program.financialServiceProviders
    ) {
      this.personalInfoTable.push({
        label: this.getLabel('fsp'),
        value: this.translatableString.get(
          this.program.financialServiceProviders.find(
            (i) => i.fsp === this.person.financialServiceProvider,
          )?.displayName,
        ),
      });
    }

    if (this.program.enableScope && this.person.scope) {
      this.personalInfoTable.push({
        label: this.getLabel('scope'),
        value: this.person.scope,
      });
    }
  }

  public async editPersonAffectedPopup() {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: EditPersonAffectedPopupComponent,
      componentProps: {
        programId: this.program.id,
        referenceId: this.person?.referenceId,
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

  private loadPermissions() {
    this.canUpdatePaData = this.authService.hasAllPermissions(this.program.id, [
      Permission.RegistrationAttributeUPDATE,
    ]);
    this.canUpdatePaFsp = this.authService.hasAllPermissions(this.program.id, [
      Permission.RegistrationFspUPDATE,
    ]);
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationPersonalREAD],
    );
    this.canUpdatePersonalData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationPersonalUPDATE],
    );
    this.canUpdateRegistrationAttributeFinancial =
      this.authService.hasAllPermissions(this.program.id, [
        Permission.RegistrationAttributeFinancialUPDATE,
      ]);
    this.canViewMessageHistory = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.RegistrationNotificationREAD],
    );
    this.canViewPaymentData = this.authService.hasAllPermissions(
      this.program.id,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );
  }
}
