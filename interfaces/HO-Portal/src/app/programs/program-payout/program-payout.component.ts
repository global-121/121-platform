import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { formatCurrency } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-program-payout',
  templateUrl: './program-payout.component.html',
  styleUrls: ['./program-payout.component.scss'],
})
export class ProgramPayoutComponent implements OnChanges {
  @Input()
  public programId: number;

  @Input()
  public transferValue: any;

  @Input()
  public currencyCode: string;

  public isEnabled = true;
  public isInProgress = false;

  private locale: string;
  public nrOfInstallments: number;
  public installments: any[];
  private totalIncluded: number;

  public confirmMessage: string;

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  async ngOnInit() {
    this.programId = this.route.snapshot.params.id;
    this.createInstallments(this.programId);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (typeof changes.programId.currentValue === 'number') {
      this.totalIncluded = await this.programsService.getTotalIncluded(this.programId);
      // this.updateTotalAmountMessage();
    }
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
      console.log(installment);
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
    console.log(installment);
    installment.isInProgress = true;
    console.log('Paying out...', installment.amount);
    this.programsService.submitPayout(+this.programId, installment.id, +installment.amount)
      .then(
        () => {
          installment.isInProgress = false;
          this.payoutResult(this.translate.instant('page.programs.program-payout.payout-success'));
          this.createInstallments(this.programId);
        },
        (err) => {
          console.log('err: ', err);
          this.payoutResult(this.translate.instant('page.programs.program-payout.payout-error'));
          this.cancelPayout(installment);
        }
      );
  }

  private async payoutResult(resultMessage: string) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [
        this.translate.instant('common.ok'),
      ],
    });

    await alert.present();
  }
}



