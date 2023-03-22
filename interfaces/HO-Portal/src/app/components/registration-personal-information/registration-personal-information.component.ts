import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { PaTableAttribute, ProgramPhase } from '../../models/program.model';
import { EditPersonAffectedPopupComponent } from '../../program/edit-person-affected-popup/edit-person-affected-popup.component';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';

class TableItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-registration-personal-information',
  templateUrl: './registration-personal-information.component.html',
  styleUrls: ['./registration-personal-information.component.css'],
})
export class RegistrationPersonalInformationComponent implements OnInit {
  @Input()
  public person: Person;

  @Input()
  private programId: number;

  public personalInfoTable: TableItem[];
  private tableAttributes: PaTableAttribute[];
  private tableAttributesToShow = [
    'namePartnerOrganization',
    'whatsappPhoneNumber',
  ];

  private canUpdatePaData: boolean;
  private canViewPersonalData: boolean;
  private canUpdatePersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canViewPaymentData: boolean;

  private statusDateKey = {
    imported: 'importedDate',
    invited: 'invitedDate',
    noLongerEligible: 'noLongerEligibleDate',
    startedRegistration: 'startedRegistrationDate',
    registered: 'registeredDate',
    registeredWhileNoLongerEligible: 'registeredWhileNoLongerEligibleDate',
    selectedForValidation: 'selectedForValidationDate',
    validated: 'validationDate',
    included: 'inclusionDate',
    inclusionEnded: 'inclusionEndDate',
    rejected: 'rejectionDate',
  };

  constructor(
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
    private authService: AuthService,
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
  ) {}

  async ngOnInit() {
    if (!this.person || !this.programId) {
      return;
    }

    this.loadPermissions();

    this.tableAttributes = await this.programsService.getPaTableAttributes(
      this.programId,
      ProgramPhase.registrationValidation,
    );

    if (!this.tableAttributes) {
      return;
    }

    this.fillPersonalInfoTable();
  }

  private fillPersonalInfoTable() {
    const translatePrefix = 'registration-details.personal-information-table.';

    const label = (key: string, interpolateParams?): string =>
      this.translate.instant(translatePrefix + key, interpolateParams);
    const dateString = (date: Date) => date.toLocaleString().split(',')[0];

    this.personalInfoTable = [
      {
        label: label('status', {
          status: this.translate.instant(
            'page.program.program-people-affected.status.' + this.person.status,
          ),
        }),
        value: dateString(this.getStatusDate(this.person.status)),
      },
      {
        label: label('primaryLanguage'),
        value: this.translate.instant(
          `page.program.program-people-affected.language.${this.person.preferredLanguage}`,
        ),
      },
      {
        label: label('phone'),
        value:
          this.person.phoneNumber === ''
            ? this.person.phoneNumber
            : `+${this.person.phoneNumber}`,
      },
    ];

    for (const ta of this.tableAttributes) {
      if (!this.tableAttributesToShow.includes(ta.name)) {
        continue;
      }

      const labelToTranslate = ta.shortLabel || ta.label;

      let value = this.person.paTableAttributes[ta.name].value;
      if (ta.type === 'tel') {
        value = value === '' ? value : `+${value}`;
      }

      this.personalInfoTable.push({
        label: this.translatableString.get(labelToTranslate),
        value,
      });
    }

    if (!this.person.fsp) {
      return;
    }

    this.personalInfoTable.push({
      label: label('fsp'),
      value: this.person.fsp,
    });
  }

  private getStatusDate(status: string): Date {
    return new Date(this.person[this.statusDateKey[status]]);
  }

  public async editPersonAffectedPopup() {
    const modal: HTMLIonModalElement = await this.modalController.create({
      component: EditPersonAffectedPopupComponent,
      componentProps: {
        person: this.person,
        programId: this.programId,
        readOnly: !this.canUpdatePaData,
        canViewPersonalData: this.canViewPersonalData,
        canUpdatePersonalData: this.canUpdatePersonalData,
        canViewMessageHistory: this.canViewMessageHistory,
        canViewPaymentData: this.canViewPaymentData,
      },
    });

    await modal.present();
  }

  private loadPermissions() {
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
  }
}
