import { CronjobExecutionService } from '@121-service/src/cronjob/services/cronjob-execution.service';

export type CronjobExecutionMethodName = keyof Pick<
  CronjobExecutionService,
  {
    [K in keyof CronjobExecutionService]: CronjobExecutionService[K] extends (
      ...args: any[]
    ) => any
      ? K
      : never;
  }[keyof CronjobExecutionService]
>;
