import { formatCurrency, formatDate } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'src/app/auth/user-role.enum';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { MetricGroup, MetricRow } from 'src/app/models/program-metrics.model';
import { DistributionFrequency, Program } from 'src/app/models/program.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import {
  getValueOrEmpty,
  getValueOrUnknown,
} from 'src/app/shared/get-value-helpers';
import { environment } from 'src/environments/environment';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss'],
})
export class MetricsComponent implements OnInit {
  @Input()
  private programId: number;

  @Input()
  public isCollapsed: boolean;

  private program: Program;
  private locale: string;
  private metricsMap: Map<string, MetricRow> = new Map();

  public metricList: MetricRow[];
  public lastUpdated: string;

  constructor(
    public translate: TranslateService,
    private translatableString: TranslatableStringService,
    private programsService: ProgramsServiceApiService,
  ) {
    this.locale = environment.defaultLocale;
  }

  public async ngOnInit() {
    this.update();
  }

  public async update() {
    this.program = await this.programsService.getProgramById(this.programId);
    this.renderUpdated();

    // The order of these methods, define the order of the metricMap/List:
    this.renderProgramProperties();
    this.renderFinancialMetrics();
    this.renderPaMetrics();
    if (this.program.validation === true) {
      this.renderAidWorkerMetrics();
    }

    // Convert to array, for use in template:
    this.metricList = Array.from(this.metricsMap.values());
  }

  private renderUpdated() {
    this.lastUpdated = getValueOrUnknown(this.program.updated);
  }

  private renderProgramProperties() {
    const group = MetricGroup.programProperties;

    this.metricsMap.set(`${group}.titlePortal`, {
      group,
      icon: 'document',
      label: 'page.program.program-details.titlePortal',
      value: getValueOrEmpty(this.program.titlePortal, (value) =>
        this.translatableString.get(value),
      ),
    });
    this.metricsMap.set(`${group}.titlePaApp`, {
      group,
      icon: 'document',
      label: 'page.program.program-details.titlePaApp',
      value: getValueOrEmpty(this.program.titlePaApp, (value) =>
        this.translatableString.get(value),
      ),
    });
    this.metricsMap.set(`${group}.startDate`, {
      group,
      icon: 'calendar',
      label: 'page.program.program-details.startDate',
      value: getValueOrEmpty(this.program.startDate, (value) =>
        formatDate(value, DateFormat.dateOnly, this.locale),
      ),
    });
    this.metricsMap.set(`${group}.endDate`, {
      group,
      icon: 'calendar',
      label: 'page.program.program-details.endDate',
      value: getValueOrEmpty(this.program.endDate, (value) =>
        formatDate(value, DateFormat.dateOnly, this.locale),
      ),
    });
    this.metricsMap.set(`${group}.location`, {
      group,
      icon: 'pin',
      label: 'page.program.program-details.location',
      value: getValueOrEmpty(this.program.location, (value) =>
        this.translatableString.get(value),
      ),
    });
  }

  private renderFinancialMetrics() {
    const group = MetricGroup.financial;
    const currencyCode = this.program.currency;
    const symbol = `${currencyCode} `;
    const locale = this.locale;

    this.metricsMap.set(`${group}.financialServiceProviders`, {
      group,
      icon: 'card',
      label: 'page.program.program-details.financialServiceProviders',
      value: getValueOrEmpty(
        this.program.financialServiceProviders,
        (value) => value.length,
      ),
    });
    this.metricsMap.set(`${group}.distributionFrequency`, {
      group,
      icon: 'repeat',
      label: 'page.program.program-details.distributionFrequency',
      value: getValueOrEmpty(this.program.distributionFrequency, (value) => {
        if (value === DistributionFrequency.week) {
          return this.translate.instant(
            'page.program.metrics.units.frequency.week',
          );
        }
        if (value === DistributionFrequency.weeks2) {
          return this.translate.instant(
            'page.program.metrics.units.frequency.weeks2',
          );
        }
        if (value === DistributionFrequency.month) {
          return this.translate.instant(
            'page.program.metrics.units.frequency.month',
          );
        }
      }),
    });
    this.metricsMap.set(`${group}.distributionDuration`, {
      group,
      icon: 'hourglass',
      label: 'page.program.program-details.distributionDuration',
      value: getValueOrEmpty(this.program.distributionDuration),
    });
    this.metricsMap.set(`${group}.fixedTransferValue`, {
      group,
      icon: 'gift',
      label: 'page.program.program-details.fixedTransferValue',
      value: getValueOrUnknown(this.program.fixedTransferValue, (value) =>
        formatCurrency(value, locale, symbol, currencyCode),
      ),
    });
  }

  private renderPaMetrics() {
    const group = MetricGroup.pa;

    this.metricsMap.set(`${group}.targeted`, {
      group,
      icon: 'locate',
      label: 'page.program.metrics.pa.targeted',
      value: getValueOrEmpty(this.program.targetNrRegistrations),
    });
  }

  private renderAidWorkerMetrics() {
    const group = MetricGroup.aidworkers;
    let nrOfFieldValidationUsers = 0;
    for (const assignment of this.program.aidworkerAssignments) {
      for (const role of assignment.roles) {
        if (role.role === UserRole.FieldValidation) {
          nrOfFieldValidationUsers = nrOfFieldValidationUsers + 1;
        }
      }
    }

    this.metricsMap.set(`${group}.assigned`, {
      group,
      icon: 'body',
      label: 'page.program.program-details.aidworkerAssignments',
      value: getValueOrEmpty(nrOfFieldValidationUsers),
    });
  }
}
