import { formatCurrency, formatNumber } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';
import { FilterOperator } from '../../enums/filters.enum';
import RegistrationStatus from '../../enums/registration-status.enum';
import { FilterService, PaginationFilter } from '../../services/filter.service';
import { PastPaymentsService } from '../../services/past-payments.service';
import { actionResult } from '../../shared/action-result';
import {
  getFspIntegrationType,
  getPaymentResultText,
} from '../../shared/payment-result';
import { PaymentUtils } from '../../shared/payment.utils';

@Component({
  selector: 'app-make-payment',
  templateUrl: './make-payment.component.html',
  styleUrls: ['./make-payment.component.scss'],
})
export class MakePaymentComponent implements OnInit, OnDestroy {
  @Input()
  public programId: number;
  @Input()
  public payment: number;
  @Input()
  public referenceIds: string[];
  @Input()
  public applicableCount: number;
  @Input()
  public sumPaymentAmountMultiplier: number;

  public isEnabled: boolean;
  public isInProgress: boolean;

  public program: Program;
  public totalIncluded: number;
  public totalTransferAmounts: number;

  public amountInput: number;
  public totalAmountMessage: string;
  public totalIncludedMessage: string;
  private dynamicPaymentId: number;

  public paymentInProgress = false;

  private doPaymentfilters: PaginationFilter[];

  private tableTextFilterSubscription: Subscription;
  private tableTextFilter: PaginationFilter[];

  private tableSatusFilterSubscription: Subscription;
  private tableStatusFilter: RegistrationStatus[];

  private locale: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private pastPaymentsService: PastPaymentsService,
    private translate: TranslateService,
    private alertController: AlertController,
    private router: Router,
    private filterService: FilterService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.ngOnInit();
      }
    });

    this.tableTextFilterSubscription = this.filterService.textFilter$.subscribe(
      this.onTextFilterChange,
    );
    this.tableSatusFilterSubscription =
      this.filterService.statusFilter$.subscribe(this.onStatusFilterChange);
  }
  ngOnDestroy(): void {
    this.tableTextFilterSubscription.unsubscribe();
    this.tableSatusFilterSubscription.unsubscribe();
  }

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);

    this.amountInput = this.program.fixedTransferValue;
    this.totalIncluded = this.applicableCount;
    this.totalTransferAmounts = this.sumPaymentAmountMultiplier;
    this.dynamicPaymentId =
      this.payment ||
      (await this.pastPaymentsService.getNextPaymentId(this.program));

    this.paymentInProgress = await this.getPaymentInProgress();

    this.doPaymentfilters = this.referenceIds.length
      ? PaymentUtils.refernceIdsToFilter(this.referenceIds)
      : this.getTableFilters();

    this.updateTotalAmountMessage();
    this.checkIsEnabled();
    this.setPaymentAmountMultiplier();
  }

  private async getPaymentInProgress(): Promise<boolean> {
    const programsPaymentStatus =
      await this.programsService.getProgramPaymentsStatus(this.programId);
    return programsPaymentStatus.inProgress;
  }

  private setPaymentAmountMultiplier(): void {
    this.programsService
      .doPayment(
        this.programId,
        this.dynamicPaymentId,
        this.amountInput,
        true,
        this.doPaymentfilters,
      )
      .then(
        (response) => {
          this.totalTransferAmounts = response.sumPaymentAmountMultiplier;
          this.updateTotalAmountMessage();
          this.checkIsEnabled();
        },
        (error) => {
          console.log('error: ', error);
        },
      );
  }

  private checkIsEnabled(): boolean {
    this.isEnabled =
      this.totalIncluded > 0 &&
      this.payment <= this.program.distributionDuration &&
      !this.paymentInProgress &&
      !!this.totalTransferAmounts;
    return this.isEnabled;
  }

  public async performPayment(): Promise<void> {
    this.isInProgress = true;
    await this.programsService
      .doPayment(
        this.programId,
        this.dynamicPaymentId,
        this.amountInput,
        false,
        this.doPaymentfilters,
      )
      .then(
        (response) => this.onPaymentSuccess(response),
        (error) => this.onPaymentError(error),
      );
  }

  private getTableFilters(): PaginationFilter[] {
    return [
      ...this.tableTextFilter,
      ...[
        {
          name: 'status',
          label: 'status',
          value: this.tableStatusFilter.join(','),
          operator: FilterOperator.in,
        },
      ],
    ];
  }

  private onPaymentSuccess(response) {
    this.resetProgress();
    let message = '';

    if (response) {
      const fspIntegrationType = getFspIntegrationType(
        response.fspsInPayment ||
          this.program.financialServiceProviders.map((fsp) => fsp.fsp),
        this.program,
      );
      message += getPaymentResultText(
        response.applicableCount,
        fspIntegrationType,
        this.translate,
      );
    }
    actionResult(this.alertController, this.translate, message, true);
  }

  private onPaymentError(error) {
    if (error && error.error && error.error.errors) {
      actionResult(this.alertController, this.translate, error.error.errors);
    } else {
      actionResult(
        this.alertController,
        this.translate,
        this.translate.instant(
          'page.program.program-payout.make-payment.error.generic',
        ),
      );
    }
    this.resetProgress();
  }

  public resetProgress(): void {
    this.isInProgress = false;
  }

  public updateTotalAmountMessage(): void {
    const totalCost = this.totalTransferAmounts * this.amountInput;
    const symbol = `${this.program.currency} `;
    const totalCostFormatted = formatCurrency(
      totalCost,
      this.locale,
      symbol,
      this.program.currency,
    );

    this.totalIncludedMessage = this.translate.instant(
      'page.program.program-payout.total-included',
      { totalIncluded: formatNumber(this.totalIncluded, this.locale) },
    );

    this.totalAmountMessage = this.translate.instant(
      'page.program.program-payout.total-amount',
      { totalCost: totalCostFormatted },
    );
  }

  public refresh() {
    window.location.reload();
  }

  private onTextFilterChange = (filter: PaginationFilter[]) => {
    this.tableTextFilter = filter;
  };

  private onStatusFilterChange = (filter: RegistrationStatus[]) => {
    this.tableStatusFilter = filter;
  };
}
