import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { NotificationType } from 'src/app/models/notification-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

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

  public btnText: string;
  public subHeader: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.btnText = this.translate.instant(
      'page.program.notification.' + this.notificationType + '.btn-text',
    );
    this.subHeader = this.translate.instant(
      'page.program.notification.' + this.notificationType + '.confirm-message',
    );
  }

  public async notify() {
    this.programsService.notify(+this.programId, NotificationType.include);
  }
}
