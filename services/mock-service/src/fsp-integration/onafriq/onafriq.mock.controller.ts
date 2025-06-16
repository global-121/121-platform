import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { OnafriqMockService } from '@mock-service/src/fsp-integration/onafriq/onafriq.mock.service';

@ApiTags('fsp/onafriq')
@Controller('fsp/onafriq')
export class OnafriqMockController {
  public constructor(private readonly onafriqMockService: OnafriqMockService) {}

  @ApiOperation({ summary: 'callService' })
  @Post('callService')
  public callService(@Body() callServiceDto: any): object {
    return this.onafriqMockService.callService(callServiceDto);
  }
}
