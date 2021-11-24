import {
  ApplicationRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TooltipService } from '@swimlane/ngx-charts';
import { Program } from 'src/app/models/program.model';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { getValueOrUnknown } from 'src/app/shared/get-value-helpers';

@Component({
  selector: 'app-metrics-states-over-time',
  templateUrl: './metrics-states-over-time.component.html',
  styleUrls: ['./metrics-states-over-time.component.scss'],
})
export class MetricsStatesOverTimeComponent implements OnChanges, OnInit {
  @Input()
  private program: Program;

  public lastUpdated: Date | string;

  public chartData: any;
  private viewRef: ViewContainerRef;

  constructor(
    private translate: TranslateService,
    private pastPaymentsService: PastPaymentsService,
    private chartToolTipService: TooltipService,
    private appRef: ApplicationRef,
  ) {}

  public async ngOnInit() {
    if (!this.appRef.components[0]) {
      return;
    }
    this.viewRef = this.appRef.components[0].instance.viewRef;
    this.chartToolTipService.injectionService.setRootViewContainer(
      this.viewRef,
    );
  }

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
