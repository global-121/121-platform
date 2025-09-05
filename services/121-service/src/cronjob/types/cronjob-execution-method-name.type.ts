import { CronjobExecutionService } from '@121-service/src/cronjob/services/cronjob-execution.service';

export type CronjobExecutionMethodName = keyof Pick<
  CronjobExecutionService,
  {
    [K in keyof CronjobExecutionService]: CronjobExecutionService[K] extends (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
      ? K
      : never;
  }[keyof CronjobExecutionService]
>;
