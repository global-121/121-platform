import {  Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { LoadTestService } from './load-test.service';

@Controller()
export class LoadTestController {
  public constructor(private readonly loadTestService: LoadTestService) {}

  @ApiOperation({ summary: 'Load test' })
  @Get('load-test/registrations')
  public async loadTest(): Promise<void> {
    return await this.loadTestService.loadTest();
  }


}
