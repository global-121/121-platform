import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';

@Component({
  selector: 'app-registration-details',
  templateUrl: './registration-details.page.html',
  styleUrls: ['./registration-details.page.css'],
})
export class RegistrationDetailsPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public paId = this.route.snapshot.params.paId;

  private program: Program;
  public person: Person;
  public personalInfoTable: {}[];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
  ) {}

  async ngOnInit() {
    if (!this.programId || !this.paId) {
      return;
    }

    this.program = await this.programsService.getProgramById(this.programId);

    const { referenceId } = await this.programsService.getReferenceId(
      this.programId,
      this.paId,
    );

    if (!referenceId || !this.program) {
      return;
    }

    const canUpdatePersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalUPDATE],
    );

    const canViewPaymentData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );

    this.person = (
      await this.programsService.getPeopleAffected(
        this.programId,
        canUpdatePersonalData,
        canViewPaymentData,
        referenceId,
      )
    )[0];

    if (!this.person) {
      return;
    }

    this.initPersonalInfoTable();
  }

  private initPersonalInfoTable() {
    const columnLabel = (col: string) =>
      this.translate.instant(
        `page.program.program-people-affected.column.${col}`,
      );
    const customAttribute = (ca: string) => ({
      label: this.translatableString.get(
        this.program.programCustomAttributes.find((attr) => attr.name === ca)
          ?.label,
      ),
      value: this.person.paTableAttributes[ca].value,
    });

    this.personalInfoTable = [
      {
        label: columnLabel('status'),
        value: this.getStatusDate(this.person.status),
      },
      {
        label: this.translate.instant(
          'page.program.program-people-affected.status.registered',
        ),
        value: this.getStatusDate('registered'),
      },
      { label: 'Last Update', value: null },
      { ...customAttribute('namePartnerOrganization') },
      {
        label: 'Payments Done',
        value: `${this.person.nrPayments || 0}${
          this.person.maxPayments
            ? ' (out of ' + this.person.maxPayments + ')'
            : ''
        }`,
      },
      {
        label: columnLabel('preferredLanguage'),
        value: this.translate.instant(
          `page.program.program-people-affected.language.${this.person.preferredLanguage}`,
        ),
      },
      { label: columnLabel('phone-number'), value: this.person.phoneNumber },
      {
        label: columnLabel('whatsappPhoneNumber'),
        value: customAttribute('whatsappPhoneNumber').value,
      },
    ];
  }

  private getStatusDate(status: string): string {
    const statusDateKey = {
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
      completed: null,
    };

    return new Date(this.person[statusDateKey[status]])
      .toLocaleString()
      .split(',')[0];
  }
}
