import { PaStatus } from '../../../models/pa-status.model';

export enum PaMetricsProperty {
  totalPaHelped = 'totalPaHelped',
}
export interface PaMetrics {
  [PaStatus.imported]?: number;
  [PaStatus.invited]?: number;
  [PaStatus.noLongerEligible]?: number;
  [PaStatus.created]: number;
  [PaStatus.registered]: number;
  [PaStatus.registeredWhileNoLongerEligible]?: number;
  [PaStatus.selectedForValidation]?: number;
  [PaStatus.validated]: number;
  [PaStatus.included]: number;
  [PaStatus.inclusionEnded]: number;
  [PaStatus.rejected]: number;
  [PaMetricsProperty.totalPaHelped]: number;
}
