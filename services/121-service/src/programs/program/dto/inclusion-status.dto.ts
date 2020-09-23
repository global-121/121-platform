import { PaStatus } from 'src/models/pa-status.model';

export class InclusionStatus {
  public readonly status: PaStatus | 'unavailable';
}
