import { SafaricomMockService } from '@mock-service/src/fsp-integration/safaricom/safaricom.mock.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('fsp/safaricom')
@Controller('fsp/safaricom')
export class SafaricomMockController {
  public constructor(
    private readonly safaricomMockService: SafaricomMockService,
  ) {}

  @ApiOperation({ summary: 'Authenticate' })
  @Get('authenticate')
  public authenticate(): object {
    return this.safaricomMockService.authenticate();
  }

  @ApiOperation({ summary: 'Transfer' })
  @Post('transfer')
  public transfer(@Body() transferDto: any): object {
    return this.safaricomMockService.transfer(transferDto);
  }
}
