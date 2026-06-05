import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';

export interface MtnTransferStatusResponse {
  readonly status: MtnTransferStatus;
  readonly reason?: string;
}
