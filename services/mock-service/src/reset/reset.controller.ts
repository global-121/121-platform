import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('reset')
@Controller()
export class ResetController {
  @ApiOperation({ summary: 'Stop sending callbacks' })
  @Get('reset/callbacks')
  public stopCallbacks(): void {
    console.log("🚀 ~ ResetController ~ stopCallbacks")
    global.queueCallbacks = {}
  }
}
