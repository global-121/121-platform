import { FundingOverview } from './../../../funding/dto/funding-overview.dto';
import { PaMetricis } from './pa-metrics.dto';
export class ProgramMetricis {
  public funding: FundingOverview;
  public pa: PaMetricis;
  public updated: Date;
}
