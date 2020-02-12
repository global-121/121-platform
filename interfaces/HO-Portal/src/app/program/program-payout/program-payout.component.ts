import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { formatCurrency } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserRole } from 'src/app/auth/user-role.enum';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-program-payout',
  templateUrl: './program-payout.component.html',
  styleUrls: ['./program-payout.component.scss'],
})
export class ProgramPayoutComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  public selectedPhase: string;

  @Input()
  public transferValue: any;

  @Input()
  public currencyCode: string;

  public isEnabled = true;
  public isInProgress = false;
  public userRoleEnum = UserRole;
  public currentUserRole: string;

  private locale: string;
  public nrOfInstallments: number;
  public installments: any[];
  private totalIncluded: number;

  public confirmMessage: string;

  public componentVisible: boolean;
  private presentInPhases = [
    'finalize',
    'payment',
  ];

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
    private authService: AuthService
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  async ngOnInit() {
    this.currentUserRole = this.authService.getUserRole();
    this.programId = this.route.snapshot.params.id;
    this.createInstallments(this.programId);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPhase && typeof changes.selectedPhase.currentValue === 'string') {
      this.checkVisibility(this.selectedPhase);
    }
    if (changes.programId && typeof changes.programId.currentValue === 'number') {
      this.totalIncluded = await this.programsService.getTotalIncluded(this.programId);
    }
  }

  public checkVisibility(phase) {
    this.componentVisible = this.presentInPhases.includes(phase);
  }

  private async createInstallments(programId) {
    const program = await this.programsService.getProgramById(programId);
    this.nrOfInstallments = program.distributionDuration;

    this.installments = Array(this.nrOfInstallments).fill(1).map((_, index) => ({
      id: index + 1,
      amount: String,
      installmentDate: new Date(),
      statusOpen: Boolean,
      firstOpen: Boolean
    }));

    const pastInstallments = await this.programsService.getPastInstallments(programId);
    const pastInstallmentIds = pastInstallments.map(item => item.installment);
    const frequency = program.distributionFrequency;

    let i = 0;
    let maxInstallmentDate: Date;
    for (const installment of this.installments) {
      if (pastInstallmentIds.includes(installment.id)
      ) {
        const pastInstallment = pastInstallments.filter(item => item.installment === installment.id)[0];
        installment.amount = pastInstallment.amount;
        installment.installmentDate = pastInstallment.installmentDate;
        installment.statusOpen = false;
        installment.firstOpen = false;

        maxInstallmentDate = new Date(installment.installmentDate);
      } else {
        installment.amount = program.fixedTransferValue;
        installment.statusOpen = true;

        // Set dates
        if (i === 0) {
          installment.installmentDate = new Date();
        } else if (frequency === 'month' || 1 === 1) { // For now do the same in all other cases then 'month'
          installment.installmentDate = new Date(maxInstallmentDate.setMonth(maxInstallmentDate.getMonth() + 1));
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
      i += 1;
    }

  }

  public updateTotalAmountMessage(installment) {
    const totalCost = this.totalIncluded * +installment.amount;
    const symbol = `${this.currencyCode} `;
    const totalCostFormatted = formatCurrency(totalCost, this.locale, symbol, this.currencyCode);

    this.confirmMessage = `${this.totalIncluded} * ${+installment.amount} = ${totalCostFormatted}`;
  }

  public cancelPayout(installment) {
    this.isEnabled = true;
    installment.isInProgress = false;
  }

  public async performPayout(installment) {
    installment.isInProgress = true;
    console.log('Paying out...', installment.amount);
    this.programsService.submitPayout(+this.programId, installment.id, +installment.amount)
      .then(
        () => {
          installment.isInProgress = false;
          this.actionResult(this.translate.instant('page.program.program-payout.payout-success'));
          this.createInstallments(this.programId);
        },
        (err) => {
          console.log('err: ', err);
          this.actionResult(this.translate.instant('page.program.program-payout.payout-error'));
          this.cancelPayout(installment);
        }
      );
  }

  public async exportList(installment) {
    this.programsService.exportList(+this.programId, installment.id)
      .then(
        () => { },
        (err) => {
          console.log('err: ', err);
          this.actionResult(this.translate.instant('page.program.program-payout.export-error'));
        }
      );
  }

  private async actionResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [
        this.translate.instant('common.ok'),
      ],
    });

    await alert.present();
  }
}



