import { DEVELOPMENT } from '@mock-service/src/config';
import { LoadTestService } from '@mock-service/src/load-test/load-test.service';
import { BadRequestException, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
export class LoadTestController {
  public constructor(private readonly loadTestService: LoadTestService) {}

  @ApiTags('load-test')
  @ApiOperation({
    summary:
      'Load test "import registrations" (Not actually related to Twilio, to be moved)',
  })
  @Post('load-test/import-registrations')
  public async loadTest(): Promise<void> {
    if (!DEVELOPMENT || !process.env.ENABLE_LOAD_TEST_121_SERVICE) {
      throw new BadRequestException(
        'Only available in DEVELOPMENT mode or when enabled with ENABLE_LOAD_TEST_121_SERVICE=TRUE',
      );
    }
    return await this.loadTestService.loadTest();
  }
}
