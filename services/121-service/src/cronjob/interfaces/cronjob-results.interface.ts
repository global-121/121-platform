import { CronjobExecutionMethodName } from '@121-service/src/cronjob/types/cronjob-execution-method-name.type';

export interface CronjobResults {
  methodName: CronjobExecutionMethodName;
  isError: boolean;
  batchSize?: number;
}
