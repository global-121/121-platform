import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatDate, formatCurrency } from '@angular/common';

import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

import { Program } from 'src/app/models/program.model';
import { ProgramMetrics, MetricRow, MetricGroup } from 'src/app/models/program-metrics.model';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class MetricsComponent implements OnChanges {
  @Input()
  public program: Program;

  private locale: string;
  private programMetrics: ProgramMetrics;
  private metricsMap: Map<string, MetricRow> = new Map();
  public metricList: IterableIterator<MetricRow>;
  public lastUpdated: string;

  constructor(
    private translate: TranslateService,
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

    this.renderFundsMetrics();
    this.renderPaMetrics();

    // Convert to array, for use in template:
    this.metricList = this.metricsMap.values();
  }

  private renderUpdated() {
    this.lastUpdated = formatDate(this.programMetrics.updated, 'full', this.locale);
  }

  private renderPaMetrics() {
    const metrics = this.programMetrics.pa;
    const group = MetricGroup.pa;

    this.metricsMap.set(`${group}.pendingVerification`, {
      group,
      icon: 'people',
      label: 'page.program.metrics.pa.pending-verification',
      value: metrics.pendingVerification,
    });
    this.metricsMap.set(`${group}.verifiedAwaitingDecision`, {
      group,
      icon: 'person',
      label: 'page.program.metrics.pa.verified-awaiting-decision',
      value: metrics.verifiedAwaitingDecision,
    });
    this.metricsMap.set(`${group}.included`, {
      group,
      icon: 'person-add',
      label: 'page.program.metrics.pa.included',
      value: metrics.included,
    });
    this.metricsMap.set(`${group}.excluded`, {
      group,
      icon: 'person',
      label: 'page.program.metrics.pa.excluded',
      value: metrics.excluded,
    });
  }

  private renderFundsMetrics() {
    const metrics = this.programMetrics.funding;
    const group = MetricGroup.funds;
    const currencyCode = this.program.currency;
    const symbol = `${currencyCode} `;
    const locale = this.locale;

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
}
