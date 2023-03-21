import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Person } from '../../models/person.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

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
  selector: 'app-registration-activity-overview',
  templateUrl: './registration-activity-overview.component.html',
  styleUrls: ['./registration-activity-overview.component.css'],
})
export class RegistrationActivityOverviewComponent implements OnInit {
  @Input()
  private person: Person;

  @Input()
  private programId: number;

  @Input()
  private referenceId: string;

  public activityOverview: ActivityOverviewItem[];
  public activityOverviewFilter: string = null;
  public activityOverviewButtons = [null, 'message', 'status', 'payment'];

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
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}

  async ngOnInit() {
    if (!this.person || !this.programId || !this.referenceId) {
      return;
    }

    this.fillActivityOverview();
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
