import { Controller, HttpStatus } from '@nestjs/common';
import { Patch } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { DEBUG } from '@121-service/src/config';
import { CronjobService } from '@121-service/src/cronjob/cronjob.service';
import { RunCronjobsResponseDto } from '@121-service/src/cronjob/dtos/run-cronjobs-response.dto';

@Controller('cronjob')
export class CronjobController {
  constructor(private readonly cronjobService: CronjobService) {}

  @ApiOperation({
    summary: 'Runs all Cron Jobs. Only used for testing.',
  })
  @ApiExcludeEndpoint(!DEBUG)
  @Patch()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cron Jobs run. See response for details.',
    type: [RunCronjobsResponseDto],
  })
  public async runAllCronjobs(): Promise<RunCronjobsResponseDto[]> {
    const cronJobMethodNames = this.cronjobService.getAllCronJobMethodNames();
    const responses: RunCronjobsResponseDto[] = [];
    for (const cronJobMethodName of cronJobMethodNames) {
      const result = await this.cronjobService[cronJobMethodName]();
      responses.push({
        methodName: cronJobMethodName,
        url: result.url,
        responseStatus: result.responseStatus,
      });
    }
    return responses;
  }
}
