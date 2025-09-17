import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface ProcessTransactionResultInput {
  registration: RegistrationEntity;
  transactionJob: SharedTransactionJobDto;
  transferAmountInMajorUnit: number;
  errorText?: string;
  customData?: Record<string, unknown>;
}
