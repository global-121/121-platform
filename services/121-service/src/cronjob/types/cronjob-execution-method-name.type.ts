import { CronjobExecutionService } from '@121-service/src/cronjob/services/cronjob-execution.service';

export type CronjobExecutionMethodName = keyof Pick<
  CronjobExecutionService,
  {
    [K in keyof CronjobExecutionService]: CronjobExecutionService[K] extends (
      ...args: never[]
    ) => Promise<unknown>
      ? K
      : CronjobExecutionService[K] extends () => Promise<unknown>
        ? K
        : CronjobExecutionService[K] extends (arg?: unknown) => Promise<unknown>
          ? K
          : never;
  }[keyof CronjobExecutionService]
>;
