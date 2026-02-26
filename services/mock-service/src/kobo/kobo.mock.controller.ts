import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import {
  KoboAssetDeployment,
  KoboMockService,
  KoboMockSubmissionUuids,
} from '@mock-service/src/kobo/kobo.mock.service';

@ApiTags('kobo')
@Controller('kobo/api/v2/assets')
export class KoboMockController {
  public constructor(private readonly koboMockService: KoboMockService) {}

  @ApiOperation({
    description:
      'Returns deployment information for a specific Kobo asset. Matches Kobo API endpoint /api/v2/assets/{uid}/deployment/',
  })
  @Get(':uid_asset/deployment')
  public getAssetDeployment(
    @Param('uid_asset') uid_asset: string,
  ): KoboAssetDeployment {
    return this.koboMockService.getAssetDeployment(uid_asset);
  }

  @ApiOperation({
    description:
      'Returns a list of all configured webhooks (REST services) for a specific Kobo asset. Matches Kobo API endpoint /api/v2/assets/{uid}/hooks/',
  })
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

  @ApiOperation({
    description:
      'Returns a specific submission by its ID or UUID. Matches Kobo API endpoint /api/v2/assets/{uid}/data/{id}/',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'ID or UUID of the submission',
    example: KoboMockSubmissionUuids.success,
  })
  @Get(':uid_asset/data/:id')
  public getSubmission(
    @Param('uid_asset') uid_asset: string,
    @Param('id') id: string,
  ): Record<string, any> {
    return this.koboMockService.getSubmission({ uid_asset, submissionId: id });
  }

  @ApiOperation({
    description:
      'Creates a new webhook (REST service) for a specific Kobo asset to receive submission notifications. Matches Kobo API endpoint /api/v2/assets/{uid}/hooks/',
  })
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

  @ApiOperation({
    description:
      'Simulates Kobo sending a webhook notification when a new submission is received. This will trigger the 121-service to process the submission.',
  })
  @Post(':uid_asset/trigger-submission')
  @HttpCode(HttpStatus.OK)
  public async triggerIncomingSubmission(
    @Param('uid_asset') uid_asset: string,
    @Body() body: { submissionUuid: KoboMockSubmissionUuids },
  ): Promise<{ message: string; submissionUuid: string }> {
    return this.koboMockService.triggerIncomingSubmission({
      assetUid: uid_asset,
      submissionUuid: body.submissionUuid,
    });
  }
}
