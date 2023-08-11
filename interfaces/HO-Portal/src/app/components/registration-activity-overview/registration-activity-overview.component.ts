import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import StatusDate from 'src/app/enums/status-dates.enum';
import { AuthService } from '../../auth/auth.service';
import Permission from '../../auth/permission.enum';
import { Person } from '../../models/person.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

class ActivityOverviewItem {
  type: string;
  label: string;
  date: Date;
  description: string;
}

enum ActivityOverviewType {
  dataChanges = 'dataChanges',
  message = 'message',
  status = 'status',
  payment = 'payment',
}

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  selector: 'app-registration-activity-overview',
  templateUrl: './registration-activity-overview.component.html',
  styleUrls: ['./registration-activity-overview.component.scss'],
})
export class RegistrationActivityOverviewComponent implements OnInit {
  @Input()
  private person: Person;

  @Input()
  private programId: number;

  @Input()
  private referenceId: string;

  public DateFormat = DateFormat;
  public activityOverview: ActivityOverviewItem[];
  public activityOverviewFilter: string = null;
  public activityOverviewButtons = [
    null,
    ActivityOverviewType.dataChanges,
    ActivityOverviewType.message,
    ActivityOverviewType.status,
    ActivityOverviewType.payment,
  ];

  private canViewPersonalData: boolean;
  private canViewMessageHistory: boolean;
  private canViewPaymentData: boolean;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    if (!this.person || !this.programId || !this.referenceId) {
      return;
    }

    this.loadPermissions();

    this.fillActivityOverview();
  }

  private async fillActivityOverview() {
    this.activityOverview = [];

    if (this.canViewMessageHistory) {
      const messageHistory = await this.programsService.retrieveMsgHistory(
        this.programId,
        this.referenceId,
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

    if (this.canViewPaymentData) {
      const payments = await this.programsService.getTransactions(
        this.programId,
        1,
        this.referenceId,
      );

      for (const payment of payments) {
        this.activityOverview.push({
          type: ActivityOverviewType.payment,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.payment.label',
            { number: payment.payment },
          ),
          date: new Date(payment.paymentDate),
          description: this.translate.instant(
            'registration-details.activity-overview.activities.payment.description',
            {
              number: payment.payment,
              status: this.translate.instant(
                'page.program.program-people-affected.transaction.' +
                  payment.status,
              ),
            },
          ),
        });
      }
    }

    if (this.canViewPersonalData) {
      for (const statusChange of this.getStatusChanges()) {
        this.activityOverview.push({
          type: ActivityOverviewType.status,
          label: this.translate.instant(
            'registration-details.activity-overview.activities.status.label',
          ),
          date: statusChange.date,
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

    this.activityOverview.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  public getIconName(type: ActivityOverviewType): string {
    const map = {
      [ActivityOverviewType.message]: 'mail-outline',
      [ActivityOverviewType.payment]: 'cash-outline',
      [ActivityOverviewType.status]: 'reload-circle-outline',
    };
    return map[type];
  }

  private getStatusChanges(): { status: string; date: Date }[] {
    const statusChanges = [];
    for (const status of Object.keys(StatusDate)) {
      const statusChangeDateValue = this.person[StatusDate[status]];
      if (statusChangeDateValue) {
        statusChanges.push({
          status,
          date: new Date(statusChangeDateValue),
        });
      }
    }

    return statusChanges;
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

  private loadPermissions() {
    this.canViewPersonalData = this.authService.hasAllPermissions(
      this.programId,
      [Permission.RegistrationPersonalREAD],
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
