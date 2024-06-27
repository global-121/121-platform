import { APP_VERSION } from '@mock-service/src/config';
import { Controller, Get, Module } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('instance')
@Controller('instance')
class InstanceController {
  @ApiOperation({ summary: 'Get version of instance' })
  @Get('version')
  public version(): {
    schemaVersion: number;
    label: string;
    message: string;
    isError?: boolean;
  } {
    const version = APP_VERSION;

    // See: https://shields.io/endpoint
    return {
      schemaVersion: 1,
      label: 'build',
      message: !!version ? version.trim() : 'n/a',
      isError: !version,
    };
  }
}

@Module({
  controllers: [InstanceController],
})
export class InstanceModule {}
