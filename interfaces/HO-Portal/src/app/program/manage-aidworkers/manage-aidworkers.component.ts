import { formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-manage-aidworkers',
  templateUrl: './manage-aidworkers.component.html',
  styleUrls: ['./manage-aidworkers.component.scss'],
})
export class ManageAidworkersComponent implements OnInit {
  @Input()
  public programId: number;

  public emailAidworker: string;
  public passwordAidworker: string;
  public passwordMinLength = 8;

  public columns = [
    {
      prop: 'email',
      name: this.translate.instant(
        'page.program.manage-aidworkers.column-email',
      ),
      sortable: true,
    },
    {
      prop: 'created',
      name: this.translate.instant(
        'page.program.manage-aidworkers.column-created',
      ),
      sortable: true,
    },
    {
      prop: 'delete',
      name: this.translate.instant(
        'page.program.manage-aidworkers.column-delete',
      ),
      sortable: false,
    },
  ];
  public aidworkers: any[];
  public isLoading: boolean;

  private locale: string;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  constructor(
    public translate: TranslateService,
    private programsService: ProgramsServiceApiService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
  }

  ngOnInit() {
    this.loadData();
  }

  public async loadData() {
    this.isLoading = true;
    const program: Program = await this.programsService.getProgramById(
      this.programId,
    );
    this.aidworkers = program.aidworkerAssignments
      ? program.aidworkerAssignments.filter((assignment) =>
          assignment.roles
            .map((r) => r.role)
            .includes(UserRole.FieldValidation),
        )
      : [];

    if (this.aidworkers && this.aidworkers.length) {
      this.aidworkers.forEach((aidworker) => {
        aidworker.email = aidworker.user ? aidworker.user.username : null;
        aidworker.created = aidworker.user
          ? formatDate(aidworker.user.created, this.dateFormat, this.locale)
          : null;
      });
    }

    this.isLoading = false;
  }

  public async deleteAidworker(row) {
    await this.programsService.deleteUser(row.user.id);
    this.loadData();
  }

  public async addAidworker() {
    this.programsService
      .addUser(this.emailAidworker, this.passwordAidworker)
      .then(
        (res) => {
          this.succesCreatedAidworker(res.user.id);
        },
        (err) => {
          let message;
          if (
            err &&
            err.error &&
            err.error.message[0] &&
            err.error.message[0].constraints
          ) {
            message = String(
              Object.values(err.error.message[0].constraints)[0],
            );
          } else if (err && err.error && err.error.errors) {
            message = String(Object.values(err.error.errors));
          } else {
            message = this.translate.instant('common.unknown-error');
          }
          this.actionResult(message);
        },
      );
  }

  private async succesCreatedAidworker(userId: number) {
    await this.programsService.assignAidworker(
      Number(this.programId),
      Number(userId),
      [UserRole.FieldValidation],
    );
    this.loadData();
    const message = this.translate.instant(
      'page.program.manage-aidworkers.succes-create',
      {
        email: this.emailAidworker,
        password: this.passwordAidworker,
      },
    );
    this.actionResult(message);
    this.emailAidworker = undefined;
    this.passwordAidworker = undefined;
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });

    await alert.present();
  }
}
