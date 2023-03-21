import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { Program } from '../../models/program.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { PubSubEvent, PubSubService } from '../../services/pub-sub.service';

class ActivityOverviewItem {
  type: string;
  label: string;
  date: Date;
  description: string;
}

enum ActivityOverviewType {
  message = 'message',
  status = 'status',
  payment = 'payment',
}
@Component({
  selector: 'app-registration-details',
  templateUrl: './registration-details.page.html',
  styleUrls: ['./registration-details.page.scss'],
})
export class RegistrationDetailsPage implements OnInit, OnDestroy {
  public programId = this.route.snapshot.params.id;
  public paId = this.route.snapshot.params.paId;

  private program: Program;
  public person: Person;
  public activityOverview: ActivityOverviewItem[];
  private referenceId: string;

  public loading = true;

  private canUpdatePersonalData: boolean;
  private canViewPaymentData: boolean;

  private pubSubSubscription: Subscription;

  public activityOverviewFilter: string = null;

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

  public activityOverviewButtons = [null, 'message', 'status', 'payment'];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private translate: TranslateService,
    private pubSub: PubSubService,
  ) {
    if (!this.pubSubSubscription) {
      this.pubSubSubscription = this.pubSub.subscribe(
        PubSubEvent.dataRegistrationChanged,
        async () => {
          this.loading = true;
          this.person = await this.loadPerson();
          this.fillActivityOverview();
          this.loading = false;
        },
      );
    }
  }

  async ngOnInit() {
    if (!this.programId || !this.paId) {
      this.loading = false;
      return;
    }

    this.program = await this.programsService.getProgramById(this.programId);

    try {
      this.referenceId = (
        await this.programsService.getReferenceId(this.programId, this.paId)
      ).referenceId;
    } catch (error) {
      console.log(error);
      this.loading = false;
      return;
    }

    if (!this.referenceId || !this.program) {
      this.loading = false;
      return;
    }

    this.loadPermissions();

    this.person = await this.loadPerson();

    if (!this.person) {
      this.loading = false;
      return;
    }

    this.fillActivityOverview();

    this.loading = false;
  }

  ngOnDestroy(): void {
    if (this.pubSubSubscription) {
      this.pubSubSubscription.unsubscribe();
    }
  }

  private async loadPerson(): Promise<Person> {
    return (
      await this.programsService.getPeopleAffected(
        this.programId,
        this.canUpdatePersonalData,
        this.canViewPaymentData,
        this.referenceId,
      )
    )[0];
  }

  private loadPermissions() {
    this.canUpdatePersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalUPDATE],
    );

    this.canViewPaymentData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.PaymentREAD, Permission.PaymentTransactionREAD],
    );
  }

  private async fillActivityOverview() {
    this.activityOverview = [];

    const messageHistory = await this.programsService.retrieveMsgHistory(
      this.programId,
      this.referenceId,
    );

    for (const message of messageHistory) {
      this.activityOverview.push({
        type: ActivityOverviewType.message,
        label: 'Message',
        date: new Date(message.created),
        description: message.body,
      });
    }

    const payments = await this.programsService.getTransactions(
      this.programId,
      1,
      this.referenceId,
    );

    for (const payment of payments) {
      this.activityOverview.push({
        type: ActivityOverviewType.payment,
        label: `Payment #${payment.payment}`,
        date: new Date(payment.paymentDate),
        description: `Payment #${payment.payment} is ${this.translate.instant(
          'page.program.program-people-affected.transaction.' + payment.status,
        )}`,
      });
    }

    for (const statusDate of this.getStatusDateList()) {
      this.activityOverview.push({
        type: ActivityOverviewType.status,
        label: 'Status Update',
        date: statusDate.date,
        description: `Person affected status changed to ${this.translate.instant(
          'page.program.program-people-affected.status.' + statusDate.status,
        )}`,
      });
    }

    this.activityOverview.sort((a, b) => {
      if (b.date > a.date) {
        return 1;
      }
      return -1;
    });
  }

  public getIconName(type: ActivityOverviewType): string {
    const map = {
      [ActivityOverviewType.message]: 'mail-outline',
      [ActivityOverviewType.payment]: 'cash-outline',
      [ActivityOverviewType.status]: 'reload-circle-outline',
    };
    return map[type];
  }

  private getStatusDateList(): { status: string; date: Date }[] {
    const statusDates = [];
    for (const status of Object.keys(this.statusDateKey)) {
      const statusDateString = this.statusDateKey[status];
      if (this.person[statusDateString]) {
        statusDates.push({
          status,
          date: new Date(this.person[statusDateString]),
        });
      }
    }

    return statusDates;
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
    if (!filter) {
      return this.activityOverview.length;
    }
    return this.activityOverview.filter((item) => item.type === filter).length;
  }
}
