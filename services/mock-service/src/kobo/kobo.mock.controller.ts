import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  KoboAssetDeployment,
  KoboMockService,
} from '@mock-service/src/kobo/kobo.mock.service';

@ApiTags('kobo')
@Controller('kobo/api/v2/assets')
export class KoboMockController {
  public constructor(private readonly koboMockService: KoboMockService) {}

  @ApiOperation({ summary: 'Get asset deployment information' })
  @Get(':uid_asset/deployment')
  public getAssetDeployment(
    @Param('uid_asset') uid_asset: string,
  ): KoboAssetDeployment {
    return this.koboMockService.getAssetDeployment(uid_asset);
  }
}
