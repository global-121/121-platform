import { formatCurrency } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { AuthService } from 'src/app/auth/auth.service';
import { UserRole } from 'src/app/auth/user-role.enum';
import { ExportType } from 'src/app/models/export-type.model';
import { Installment, InstallmentData } from 'src/app/models/installment.model';
import { Program, ProgramPhase } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-program-payout',
  templateUrl: './program-payout.component.html',
  styleUrls: ['./program-payout.component.scss'],
})
export class ProgramPayoutComponent implements OnInit {
  @Input()
  public programId: number;

  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public enumExportType = ExportType;

  public isEnabled = true;
  public isInProgress = false;
  public userRoleEnum = UserRole;
  public currentUserRoles: UserRole[] | string[];

  private program: Program;
  public nrOfInstallments: number;
  public nrOfPastInstallments: number;
  public installments: Installment[];
  public totalIncluded: number;

  private activePhase: ProgramPhase;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.currentUserRoles = this.authService.getUserRoles();
    this.isCompleted.emit(false);

    this.program = await this.programsService.getProgramById(this.programId);

    this.createInstallments();
  }

  private async createInstallments() {
    this.totalIncluded = await this.programsService.getTotalIncluded(
      this.programId,
    );
    this.activePhase = ProgramPhase[this.program.state];
    this.nrOfInstallments = this.program.distributionDuration;

    this.installments = Array(this.nrOfInstallments)
      .fill(1)
      .map((_, index) => ({
        id: index + 1,
        amount: 0,
        installmentDate: new Date(),
      }));

    const pastInstallments = await this.programsService.getPastInstallments(
      this.programId,
    );
    this.nrOfPastInstallments = pastInstallments.length;
    const pastInstallmentIds = pastInstallments.map((item) => item.id);

    let maxInstallmentDate: Date;
    this.installments.forEach((installment, index) => {
      if (pastInstallmentIds.includes(installment.id)) {
        const pastInstallment = pastInstallments.find(
          (item) => item.id === installment.id,
        );
        installment.amount = pastInstallment.amount;
        installment.installmentDate = pastInstallment.installmentDate;
        installment.statusOpen = false;
        installment.firstOpen = false;

        maxInstallmentDate = new Date(installment.installmentDate);
      } else {
        installment.amount = this.program.fixedTransferValue;
        installment.statusOpen = true;

        // Set dates
        if (index === 0) {
          installment.installmentDate = new Date();
        } else if (this.program.distributionFrequency === 'week') {
          installment.installmentDate = new Date(
            maxInstallmentDate.setDate(maxInstallmentDate.getDate() + 7),
          );
        } else {
          // For now do the same in all other cases then 'month'
          installment.installmentDate = new Date(
            maxInstallmentDate.setMonth(maxInstallmentDate.getMonth() + 1),
          );
        }
        maxInstallmentDate = new Date(installment.installmentDate);

        installment.firstOpen = this.isFirstOpen(index);
      }

      installment.isExportAvailable = this.isExportAvailable(installment);
    });

    this.checkPhaseReady();
  }

  private isFirstOpen(index: number) {
    const previousInstallment = this.installments[index - 1];
    return index === 0 || !previousInstallment.statusOpen;
  }

  public isExportAvailable(installment: Installment) {
    return (
      (installment.firstOpen && this.totalIncluded > 0) ||
      !installment.statusOpen
    );
  }

  public getTotalAmountMessage(installment: InstallmentData) {
    const totalCost = this.totalIncluded * installment.amount;
    const symbol = `${this.program.currency} `;
    const totalCostFormatted = formatCurrency(
      totalCost,
      environment.defaultLocale,
      symbol,
      this.program.currency,
    );

    return `${this.totalIncluded} * ${installment.amount} = ${totalCostFormatted}`;
  }

  public cancelPayout(installment: Installment) {
    this.isEnabled = true;
    installment.isInProgress = false;
  }

  public async performPayout(installment: Installment) {
    installment.isInProgress = true;
    console.log('Paying out...', installment.amount);
    this.programsService
      .submitPayout(+this.programId, installment.id, installment.amount)
      .then(
        (response) => {
          installment.isInProgress = false;
          const message = ''
            .concat(
              response.nrSuccessfull > 0
                ? this.translate.instant(
                    'page.program.program-payout.result-success',
                    { nrSuccessfull: response.nrSuccessfull },
                  )
                : '',
            )
            .concat(
              response.nrFailed > 0
                ? '<br><br>' +
                    this.translate.instant(
                      'page.program.program-payout.result-failure',
                      { nrFailed: response.nrFailed },
                    )
                : '',
            )
            .concat(
              response.nrWaiting > 0
                ? '<br><br>' +
                    this.translate.instant(
                      'page.program.program-payout.result-waiting',
                      { nrWaiting: response.nrWaiting },
                    )
                : '',
            );
          this.actionResult(message, true);
          this.createInstallments();
        },
        (err) => {
          console.log('err: ', err);
          if (err.error.errors) {
            this.actionResult(err.error.errors);
          }
          this.cancelPayout(installment);
        },
      );
  }

  public async exportList(installment: Installment) {
    this.programsService
      .exportPaymentList(+this.programId, installment.id)
      .then(
        (res) => {
          const blob = new Blob([res.data], { type: 'text/csv' });
          saveAs(blob, res.fileName);
        },
        (err) => {
          console.log('err: ', err);
          this.actionResult(this.translate.instant('common.export-error'));
        },
      );
  }

  private async actionResult(resultMessage: string, refresh: boolean = false) {
    const alert = await this.alertController.create({
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

  private checkPhaseReady() {
    const isReady =
      this.activePhase !== ProgramPhase.payment ||
      this.nrOfPastInstallments === this.nrOfInstallments;

    this.isCompleted.emit(isReady);
  }

  public payoutDisabled(installment: Installment) {
    return (
      !this.isEnabled ||
      !installment.firstOpen ||
      this.totalIncluded === 0 ||
      !this.currentUserRoles.includes(UserRole.RunProgram) ||
      this.activePhase !== ProgramPhase.payment
    );
  }
}
