import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
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

  @ApiOperation({ summary: 'Get existing webhooks (REST services) for asset' })
  @Get(':uid_asset/hooks')
  public getExistingWebhooks(@Param('uid_asset') uid_asset: string): {
    results: {
      name: string;
      url: string;
      subset_fields: string[];
    }[];
  } {
    return this.koboMockService.getExistingWebhooks(uid_asset);
  }

  @ApiOperation({ summary: 'Create a new webhook (REST service) for asset' })
  @Post(':uid_asset/hooks')
  @HttpCode(HttpStatus.CREATED)
  public createWebhook(
    @Param('uid_asset') _: string,
    @Body()
    body: {
      name: string;
      url: string;
      active: boolean;
      subset_fields: string[];
    },
  ): {
    uid: string;
    name: string;
    url: string;
    active: boolean;
    subset_fields: string[];
  } {
    return this.koboMockService.createWebhook(body);
  }
}
