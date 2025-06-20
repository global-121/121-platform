import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { OnafriqCallServiceResponseBodyDto } from '@mock-service/src/fsp-integration/onafriq/onafriq.dto';
import { OnafriqMockService } from '@mock-service/src/fsp-integration/onafriq/onafriq.mock.service';

@ApiTags('fsp/onafriq')
@Controller('fsp/onafriq')
export class OnafriqMockController {
  public constructor(private readonly onafriqMockService: OnafriqMockService) {}

  @ApiOperation({ summary: 'callService' })
  @Post('callService')
  public async callService(
    @Body() callServiceDto: any,
  ): Promise<OnafriqCallServiceResponseBodyDto> {
    return await this.onafriqMockService.callService(callServiceDto);
  }
}
