import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Program } from 'src/app/models/program.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';

@Component({
  selector: 'app-metrics-states-over-time',
  templateUrl: './metrics-states-over-time.component.html',
  styleUrls: ['./metrics-states-over-time.component.scss'],
})
export class MetricsStatesOverTimeComponent implements OnChanges {
  @Input()
  private program: Program;

  public lastUpdated: Date | string;

  public chartData: any;

  constructor(
    private translate: TranslateService,
    private pastPaymentsService: PastPaymentsService,
  ) {}

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes.program && typeof changes.program.currentValue === 'object') {
      this.update();
    }
  }

  public async update() {
    this.chartData = await this.createChartData();
    this.lastUpdated = getValueOrUnknown(this.program.updated);
  }

  private async createChartData() {
    const pastPayments =
      await this.pastPaymentsService.getPaymentsWithStateSums(this.program.id);

    const chartData = pastPayments.map((payment) => {
      return {
        name: `#${payment.id}`,
        series: [
          {
            name: this.translate.instant(
              'page.program.metrics.over-time.pa.pre-existing',
            ),
            value: payment.values['pre-existing'],
          },
          {
            name: this.translate.instant(
              'page.program.metrics.over-time.pa.new',
            ),
            value: payment.values.new,
          },
        ],
      };
    });

    return chartData;
  }
}
