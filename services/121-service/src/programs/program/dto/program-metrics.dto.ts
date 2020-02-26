import { FundingOverview } from './../../../funding/dto/funding-overview.dto';
import { PaMetrics } from './pa-metrics.dto';
export class ProgramMetrics {
  public funding: FundingOverview;
  public pa: PaMetrics;
  public updated: Date;
}
