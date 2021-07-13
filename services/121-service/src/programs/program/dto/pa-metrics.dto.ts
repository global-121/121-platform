import { PaStatus } from '../../../models/pa-status.model';

export interface PaMetrics {
  [PaStatus.created]: number;
  [PaStatus.registered]: number;
  [PaStatus.validated]: number;
  [PaStatus.included]: number;
  [PaStatus.inclusionEnded]: number;
  [PaStatus.rejected]: number;
}
