import { CronjobExecutionMethodName } from '@121-service/src/cronjob/interfaces/cronjob-execution-method-name.type';

export interface CronjobResults {
  methodName: CronjobExecutionMethodName;
  isError: boolean;
  batchSize?: number;
}
