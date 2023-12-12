import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoadTestService } from './load-test.service';

@Controller()
export class LoadTestController {
  public constructor(private readonly loadTestService: LoadTestService) {}

  @ApiTags('2. load-test')
  @ApiOperation({
    summary:
      'Load test "import registrations" (Not actually related to Twilio, to be moved)',
  })
  @Post('load-test/import-registrations')
  public async loadTest(): Promise<void> {
    return await this.loadTestService.loadTest();
  }
}
