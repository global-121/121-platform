import { formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ActionType } from 'src/app/models/action-type.model';
import { NotificationType } from 'src/app/models/notification-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  @Input()
  public programId: number;
  @Input()
  public userRole: UserRole;
  @Input()
  public notificationType: NotificationType;

  public disabled: boolean;
  public btnText: string;
  public subHeader: string;
  public timestamp: string;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  private actionType: ActionType;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {
    this.locale = environment.defaultLocale;
  }

  async ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.notification.' + this.notificationType + '.btn-text',
    );
    this.subHeader = this.translate.instant(
      'page.program.notification.' + this.notificationType + '.confirm-message',
    );

    this.actionType =
      this.notificationType === NotificationType.include
        ? ActionType.notifyIncluded
        : null;

    this.disabled = await this.btnDisabled();
  }

  private async retrieveStatusAndTimestamp() {
    const timestamps = (
      await this.programsService.retrieveActions(
        this.actionType,
        +this.programId,
      )
    ).map((a) => new Date(a.timestamp));

    const maxTimestamp =
      timestamps.length > 0 ? new Date(Math.max.apply(null, timestamps)) : null;
    this.timestamp = maxTimestamp
      ? formatDate(maxTimestamp, this.dateFormat, this.locale)
      : null;
  }

  public async btnDisabled() {
    await this.retrieveStatusAndTimestamp();

    return this.userRole === UserRole.ProgramManager || !!this.timestamp;
  }

  public async notify() {
    await this.programsService.notify(+this.programId, this.notificationType);

    if (this.actionType) {
      await this.programsService.saveAction(this.actionType, +this.programId);
      this.disabled = await this.btnDisabled();
    }
  }
}
