import { Injectable } from '@nestjs/common';

import { CronjobResults } from '@121-service/src/cronjob/interfaces/cronjob-results.interface';
import { CronjobExecutionMethodName } from '@121-service/src/cronjob/types/cronjob-execution-method-name.type';
import { env } from '@121-service/src/env';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Injectable()
export class CronjobExecutionHelperService {
  constructor(private readonly azureLogService: AzureLogService) {}

  public async executeWithLogging(
    methodName: CronjobExecutionMethodName,
    fn: () => Promise<number>,
  ): Promise<number | undefined> {
    const startMessage = this.createCronjobStartMessage(methodName);
    this.azureLogService.consoleLogAndTraceAzure(startMessage);

    try {
      // Execute the cron job function and await its result
      const batchSize = await fn();

      // Handle the result and log the end message
      const cronjobResultMessage = this.createCronjobResultMessage({
        methodName,
        batchSize,
        isError: false,
      });
      this.azureLogService.consoleLogAndTraceAzure(cronjobResultMessage);
      return batchSize;
    } catch (error) {
      // 1. Log the stack trace to the Node logs
      console.error(`Error executing cron job ${methodName}:`, error);

      // 2. Log the cronjob end message to Azure Application Insights and trigger an alert
      const cronjobResultMessage = this.createCronjobResultMessage({
        methodName,
        isError: true,
      });
      this.azureLogService.logError(new Error(cronjobResultMessage), true);
    }
  }

  private createCronjobStartMessage(
    methodName: CronjobExecutionMethodName,
  ): string {
    return `[CRON START] ${env.ENV_NAME} - ${methodName} started at ${new Date().toISOString()}`;
  }

  private createCronjobResultMessage(cronjobResults: CronjobResults): string {
    const { methodName, batchSize, isError } = cronjobResults;
    let message = `[CRON END] ${env.ENV_NAME} - ${methodName} finished at ${new Date().toISOString()}`;
    const details: string[] = [];
    if (typeof batchSize === 'number') {
      details.push(`batchSize=${batchSize}`);
    }
    if (isError) {
      details.push('isError=true');
    }
    if (details.length > 0) {
      message += ` (${details.join(', ')})`;
    }
    return message;
  }
}
