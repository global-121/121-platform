import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatDate, formatCurrency } from '@angular/common';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

import { Program } from 'src/app/models/program.model';
import { ProgramMetrics, MetricRow, MetricGroup } from 'src/app/models/program-metrics.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class MetricsComponent implements OnChanges {
  @Input()
  private program: Program;
  private locale: string;
  private programMetrics: ProgramMetrics;
  private metricsMap: Map<string, MetricRow> = new Map();

  public metricList: MetricRow[];
  public lastUpdated: string;

  constructor(
    private translate: TranslateService,
    private translatableString: TranslatableStringService,
    private programService: ProgramsServiceApiService,
  ) {
    this.locale = this.translate.getBrowserCultureLang();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.program && typeof changes.program.currentValue === 'object') {
      this.update();
    }
  }

  public async update() {
    this.programMetrics = await this.programService.getMetricsById(this.program.id);

    this.renderUpdated();

    this.renderProgramProperties();
    this.renderFinancialMetrics();
    this.renderPaMetrics();
    this.renderAidWorkerMetrics();

    // Convert to array, for use in template:
    this.metricList = Array.from(this.metricsMap.values());
  }

  private renderUpdated() {
    this.lastUpdated = formatDate(this.programMetrics.updated, 'full', this.locale);
  }

  private renderProgramProperties() {
    const group = MetricGroup.programProperties;

    this.metricsMap.set(`${group}.title`, {
      group,
      icon: 'document',
      label: 'page.program.program-details.title',
      value: this.translatableString.get(this.program.title),
    });
    this.metricsMap.set(`${group}.startDate`, {
      group,
      icon: 'calendar',
      label: 'page.program.program-details.startDate',
      value: formatDate(this.program.startDate, 'shortDate', this.locale),
    });
    this.metricsMap.set(`${group}.endDate`, {
      group,
      icon: 'calendar',
      label: 'page.program.program-details.endDate',
      value: formatDate(this.program.endDate, 'shortDate', this.locale),
    });
    this.metricsMap.set(`${group}.location`, {
      group,
      icon: 'pin',
      label: 'page.program.program-details.location',
      value: this.translatableString.get(this.program.location),
    });
  }

  private renderFinancialMetrics() {
    const metrics = this.programMetrics.funding;
    const group = MetricGroup.financial;
    const currencyCode = this.program.currency;
    const symbol = `${currencyCode} `;
    const locale = this.locale;

    this.metricsMap.set(`${group}.financialServiceProviders`, {
      group,
      icon: 'card',
      label: 'page.program.program-details.financialServiceProviders',
      value: this.program.financialServiceProviders.length,
    });
    this.metricsMap.set(`${group}.descCashType`, {
      group,
      icon: 'card',
      label: 'page.program.program-details.descCashType',
      value: this.translatableString.get(this.program.descCashType),
    });
    this.metricsMap.set(`${group}.distributionFrequency`, {
      group,
      icon: 'repeat',
      label: 'page.program.program-details.distributionFrequency',
      value: this.translate.instant('page.program.metrics.units.' + this.program.distributionFrequency),
    });
    this.metricsMap.set(`${group}.distributionDuration`, {
      group,
      icon: 'hourglass',
      label: 'page.program.program-details.distributionDuration',
      value: `${this.program.distributionDuration} ${this.translate.instant('page.program.metrics.units.' + this.program.distributionFrequency)}`,
    });
    this.metricsMap.set(`${group}.fixedTransferValue`, {
      group,
      icon: 'gift',
      label: 'page.program.program-details.fixedTransferValue',
      value: formatCurrency(this.program.fixedTransferValue, locale, symbol, currencyCode),
    });
    this.metricsMap.set(`${group}.totalRaised`, {
      group,
      icon: 'cash',
      label: 'page.program.metrics.funds.raised',
      value: formatCurrency(metrics.totalRaised, locale, symbol, currencyCode),
    });
    this.metricsMap.set(`${group}.totalTransferred`, {
      group,
      icon: 'cash',
      label: 'page.program.metrics.funds.transferred',
      value: formatCurrency(metrics.totalTransferred, locale, symbol, currencyCode),
    });
    this.metricsMap.set(`${group}.totalAvailable`, {
      group,
      icon: 'cash',
      label: 'page.program.metrics.funds.available',
      value: formatCurrency(metrics.totalAvailable, locale, symbol, currencyCode),
    });
  }

  private renderPaMetrics() {
    const metrics = this.programMetrics.pa;
    const group = MetricGroup.pa;

    this.metricsMap.set(`${group}.targeted`, {
      group,
      icon: 'locate',
      label: 'page.program.metrics.pa.targeted',
      value: this.program.highestScoresX,
    });
    this.metricsMap.set(`${group}.pendingVerification`, {
      group,
      icon: 'people',
      label: 'page.program.metrics.pa.pending-verification',
      value: metrics.pendingVerification,
    });
    this.metricsMap.set(`${group}.verifiedAwaitingDecision`, {
      group,
      icon: 'contact',
      label: 'page.program.metrics.pa.verified-awaiting-decision',
      value: metrics.verifiedAwaitingDecision,
    });
    this.metricsMap.set(`${group}.included`, {
      group,
      icon: 'checkmark-circle-outline',
      label: 'page.program.metrics.pa.included',
      value: metrics.included,
    });
    this.metricsMap.set(`${group}.excluded`, {
      group,
      icon: 'close-circle',
      label: 'page.program.metrics.pa.excluded',
      value: metrics.excluded,
    });
  }

  private renderAidWorkerMetrics() {
    const group = MetricGroup.aidworkers;

    this.metricsMap.set(`${group}.assigned`, {
      group,
      icon: 'body',
      label: 'page.program.program-details.aidworkers',
      value: this.program.aidworkers.length,
    });
  }
}
