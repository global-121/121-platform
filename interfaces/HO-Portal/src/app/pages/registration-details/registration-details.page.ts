import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

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

  public loading = true;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private translate: TranslateService,
  ) {}

  async ngOnInit() {
    if (!this.programId || !this.paId) {
      this.loading = false;
      return;
    }

    this.program = await this.programsService.getProgramById(this.programId);

    let referenceId: string = null;

    try {
      referenceId = (
        await this.programsService.getReferenceId(this.programId, this.paId)
      ).referenceId;
    } catch (error) {
      console.log(error);
      this.loading = false;
      return;
    }

    if (!referenceId || !this.program) {
      this.loading = false;
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
      this.loading = false;
      return;
    }

    this.initPersonalInfoTable();
    this.loading = false;
  }

  private initPersonalInfoTable() {
    const translatePrefix = 'registration-details.personal-information-table.';

    const label = (key: string, interpolateParams?): string =>
      this.translate.instant(translatePrefix + key, interpolateParams);
    const customAttribute = (ca: string) =>
      this.person.paTableAttributes[ca].value;

    this.personalInfoTable = [
      {
        label: label('status', {
          status: this.translate.instant(
            'page.program.program-people-affected.status.' + this.person.status,
          ),
        }),
        value: this.getStatusDate(this.person.status),
      },
      {
        label: label('registeredDate'),
        value: this.getStatusDate('registered'),
      },
      { label: label('lastUpdateDate'), value: null },
      {
        label: label('partnerOrganization'),
        value: customAttribute('namePartnerOrganization'),
      },
      {
        label: label('paymentsDone'),
        value: `${this.person.nrPayments || 0}${
          this.person.maxPayments
            ? ' (out of ' + this.person.maxPayments + ')'
            : ''
        }`,
      },
      {
        label: label('primaryLanguage'),
        value: this.translate.instant(
          `page.program.program-people-affected.language.${this.person.preferredLanguage}`,
        ),
      },
      { label: label('phone'), value: this.person.phoneNumber },
      {
        label: label('whatsappNumber'),
        value: customAttribute('whatsappPhoneNumber'),
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
