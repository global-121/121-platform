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
    const programId = this.route.snapshot.params.id;
    this.createInstallments(programId);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (typeof changes.programId.currentValue === 'number') {
      this.totalIncluded = await this.programsService.getTotalIncluded(this.programId);
      this.updateTotalAmountMessage();
    }
  }

  private async createInstallments(programId) {
    const program = await this.programsService.getProgramById(programId);
    this.nrOfInstallments = program.distributionDuration;

    this.installments = Array(this.nrOfInstallments).fill(1).map((_, i) => ({
      id: i + 1,
      amount: String,
      installmentDate: Date,
      statusOpen: Boolean,
    this.installments = Array.from(Array(this.nrOfInstallments).keys());

    const pastInstallments = await this.programsService.getPastInstallments(programId);

      if (pastInstallments
        .map(item => item.installment)
        .includes(installment.id)
      ) {

        const pastInstallment = pastInstallments.filter(item => item.installment = installment.id)[0];
        installment.amount = pastInstallment.amount;
        installment.installmentDate = pastInstallment.installmentDate;
        installment.statusOpen = false;
      } else {
        installment.statusOpen = true;
      }
    }

  }

  public updateTotalAmountMessage() {
    const totalCost = this.totalIncluded * this.transferValue;
    const symbol = `${this.currencyCode} `;
    const totalCostFormatted = formatCurrency(totalCost, this.locale, symbol, this.currencyCode);

    this.confirmMessage = `${this.totalIncluded} * ${this.transferValue} = ${totalCostFormatted}`;
  }

  public cancelPayout() {
    this.isEnabled = true;
    this.isInProgress = false;
  }

  public async performPayout(installment) {
    this.isInProgress = true;
    console.log('Paying out...', this.transferValue);
    this.programsService.submitPayout(this.programId, installment, +this.transferValue)
      .then(
        () => {
          this.isInProgress = false;
          this.payoutResult(this.translate.instant('page.programs.program-payout.payout-success'));
        },
        () => {
          this.payoutResult(this.translate.instant('page.programs.program-payout.payout-error'));
          this.cancelPayout();
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

