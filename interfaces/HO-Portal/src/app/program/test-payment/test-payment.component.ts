import { formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ActionType } from 'src/app/models/action-type.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

enum fspName {
  africasTalking = 'Africas-talking',
}

@Component({
  selector: 'app-test-payment',
  templateUrl: './test-payment.component.html',
  styleUrls: ['./test-payment.component.scss'],
})
export class TestPaymentComponent implements OnInit {
  @Input()
  public programId: number;

  public isDisabled: boolean;
  public visible = false;

  private locale: string;
  public actionTimestamp;
  private dateFormat = 'yyyy-MM-dd, HH:mm';

  public isInProgress = false;

  constructor(
    private authService: AuthService,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = environment.defaultLocale;
    this.isDisabled = !this.authService.hasUserRole([UserRole.PersonalData]);
  }

  async ngOnInit() {
    const program = await this.programsService.getProgramById(this.programId);

    if (!program || !program.financialServiceProviders) {
      return;
    }

    if (
      program.financialServiceProviders &&
      program.financialServiceProviders
        .map((fsp) => fsp.fsp)
        .includes(fspName.africasTalking)
    ) {
      this.visible = true;
    }

    await this.getLatestActionTime();
  }

  public async getLatestActionTime(): Promise<void> {
    const latestAction = await this.programsService.retrieveLatestActions(
      ActionType.testMpesaPayment,
      this.programId,
    );
    if (latestAction) {
      this.actionTimestamp = formatDate(
        new Date(latestAction.timestamp),
        this.dateFormat,
        this.locale,
      );
    }
  }

  public async doTestPayment() {
    this.isInProgress = true;
    const installment = -1;
    const amount = 0;
    await this.programsService
      .submitPayout(this.programId, installment, amount)
      .then(
        () => {
          this.isInProgress = false;
          const message = this.translate.instant(
            'page.program.test-payment.result',
          );
          this.actionResult(message, true);
        },
        (err) => {
          console.log('err: ', err);
          if (err && err.error && err.error.errors) {
            this.actionResult(err.error.errors);
          }
        },
      );
  }

  private async actionResult(resultMessage: string, refresh: boolean = false) {
    const alert = await this.alertController.create({
      backdropDismiss: false,
      message: resultMessage,
      buttons: [
        {
          text: this.translate.instant('common.ok'),
          handler: () => {
            alert.dismiss(true);
            if (refresh) {
              window.location.reload();
            }
            return false;
          },
        },
      ],
    });

    await alert.present();
  }
}
