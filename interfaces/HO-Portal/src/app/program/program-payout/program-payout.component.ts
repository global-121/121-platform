import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { formatCurrency } from '@angular/common';
import { saveAs } from 'file-saver';
import { UserRole } from 'src/app/auth/user-role.enum';
import { AuthService } from 'src/app/auth/auth.service';
import { ProgramPhase, Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-program-payout',
  templateUrl: './program-payout.component.html',
  styleUrls: ['./program-payout.component.scss'],
})
export class ProgramPayoutComponent implements OnInit {
  @Input()
  public programId: number;

  @Output()
  triggerRefresh: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  isCompleted: EventEmitter<boolean> = new EventEmitter<boolean>();

  public isEnabled = true;
  public isInProgress = false;
  public userRoleEnum = UserRole;
  public currentUserRole: string;

  private program: Program;
  private locale: string;
  public nrOfInstallments: number;
  public nrOfPastInstallments: number;
  public installments: any[];
  public totalIncluded: number;

  public confirmMessage: string;

  private activePhase: ProgramPhase;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
    private authService: AuthService,
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  async ngOnInit() {
    this.currentUserRole = this.authService.getUserRole();
    this.isCompleted.emit(false);

    this.program = await this.programsService.getProgramById(this.programId);

    this.createInstallments(this.programId);
  }

  private async createInstallments(programId) {
    this.totalIncluded = await this.programsService.getTotalIncluded(
      this.programId,
    );
    this.activePhase = ProgramPhase[this.program.state];
    this.nrOfInstallments = this.program.distributionDuration;

    this.installments = Array(this.nrOfInstallments)
      .fill(1)
      .map((_, index) => ({
        id: index + 1,
        amount: String,
        installmentDate: new Date(),
        statusOpen: Boolean,
        firstOpen: Boolean,
      }));

    const pastInstallments = await this.programsService.getPastInstallments(
      programId,
    );
    this.nrOfPastInstallments = pastInstallments.length;
    const pastInstallmentIds = pastInstallments.map((item) => item.installment);
    const frequency = this.program.distributionFrequency;

    let i = 0;
    let maxInstallmentDate: Date;
    for (const installment of this.installments) {
      if (pastInstallmentIds.includes(installment.id)) {
        const pastInstallment = pastInstallments.filter(
          (item) => item.installment === installment.id,
        )[0];
        installment.amount = pastInstallment.amount;
        installment.installmentDate = pastInstallment.installmentDate;
        installment.statusOpen = false;
        installment.firstOpen = false;

        maxInstallmentDate = new Date(installment.installmentDate);
      } else {
        installment.amount = this.program.fixedTransferValue;
        installment.statusOpen = true;

        // Set dates
        if (i === 0) {
          installment.installmentDate = new Date();
        } else if (frequency === 'month' || 1 === 1) {
          // For now do the same in all other cases then 'month'
          installment.installmentDate = new Date(
            maxInstallmentDate.setMonth(maxInstallmentDate.getMonth() + 1),
          );
        }
        maxInstallmentDate = new Date(installment.installmentDate);

        // Determine first 'open' installment
        if (i === 0 || !this.installments[i - 1].statusOpen) {
          installment.firstOpen = true;
          this.updateTotalAmountMessage(installment);
        } else {
          installment.firstOpen = false;
        }
      }
      installment.isExportAvailable = this.isExportAvailable(installment);
      i += 1;
    }

    this.checkPhaseReady();
  }

  public isExportAvailable(installment) {
    if (installment.firstOpen && this.totalIncluded > 0) {
      return true;
    } else if (!installment.statusOpen) {
      return true;
    } else {
      return false;
    }
  }

  public updateTotalAmountMessage(installment) {
    const totalCost = this.totalIncluded * +installment.amount;
    const symbol = `${this.program.currency} `;
    const totalCostFormatted = formatCurrency(
      totalCost,
      this.locale,
      symbol,
      this.program.currency,
    );

    this.confirmMessage = `${
      this.totalIncluded
    } * ${+installment.amount} = ${totalCostFormatted}`;
  }

  public cancelPayout(installment) {
    this.isEnabled = true;
    installment.isInProgress = false;
  }

  public async performPayout(installment) {
    installment.isInProgress = true;
    console.log('Paying out...', installment.amount);
    this.programsService
      .submitPayout(+this.programId, installment.id, +installment.amount)
      .then(
        () => {
          installment.isInProgress = false;
          this.actionResult(
            this.translate.instant(
              'page.program.program-payout.payout-success',
            ),
          );
          this.createInstallments(this.programId);
          this.triggerRefresh.emit(true);
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

  public async exportList(installment) {
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

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [this.translate.instant('common.ok')],
    });

    await alert.present();
  }

  private checkPhaseReady() {
    const isReady =
      this.activePhase !== ProgramPhase.payment ||
      this.nrOfPastInstallments === this.nrOfInstallments;

    this.isCompleted.emit(isReady);
  }
}
