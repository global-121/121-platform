import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';

import { DEBUG } from '@121-service/src/config';
import { CronjobService } from '@121-service/src/cronjob/cronjob.service';

@Controller('cronjob')
export class CronjobController {
  constructor(private readonly cronjobService: CronjobService) {}

  // ##TODO: Should we protect this endpoint with a secret?
  @ApiOperation({
    summary: 'Runs all Cron Jobs. Only used for testing purposes.',
  })
  @ApiExcludeEndpoint(!DEBUG)
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async runAllCronjobs(): Promise<void> {
    const methods = this.cronjobService.getAllMethods();
    for (const method of methods) {
      await this.cronjobService[method]();
    }
  }
}
