import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';

export interface MtnTransferCallbackJobDto {
  readonly transactionId: number;
  readonly referenceId: string;
  readonly status: MtnTransferStatus;
  readonly reason?: string;
}
