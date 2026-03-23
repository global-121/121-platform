import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler/dist/throttler.decorator';
import { Response } from 'express';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { NoUserAuthenticationEndpoint } from '@121-service/src/guards/no-user-authentication.decorator';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { KoboIntegrationResultDto } from '@121-service/src/kobo/dtos/kobo-integration-result.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboWebhookBasicAuthGuard } from '@121-service/src/kobo/guards/kobo-webhook-basic-auth.guard';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboSubmissionService } from '@121-service/src/kobo/services/kobo-submission.service';
import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/kobo')
@Controller()
export class KoboController {
  public constructor(
    private readonly koboService: KoboService,
    private readonly koboSubmissionService: KoboSubmissionService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Integrate a Kobo form with a Program',
    description: `Integrates a deployed Kobo form with the specified program. This will:
    - Validate the Kobo form against program requirements and FSP configurations
    - Import form fields as program registration attributes
    - Add new languages from the form to the program
    - Create or update the Kobo integration record
    Use dryRun=true to validate the integration without making changes.`,
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    description: 'The unique identifier of the program to integrate with',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'The Kobo form has been successfully integrated with the program',
    type: KoboIntegrationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run completed successfully - the integration would succeed if executed',
    type: KoboIntegrationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist, or Kobo form could not be found at the specified URL/asset ID',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Validation failed - the Kobo form does not meet program requirements. ',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'User is not authenticated, Kobo API token is invalid, or user lacks admin privileges',
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description: `When set to "true", validates the Kobo form integration without making any changes to the program. This allows you to check if the integration would succeed before executing it. Returns 200 if validation passes, or an appropriate error status if validation fails.`,
    example: false,
  })
  @Post('programs/:programId/kobo')
  public async createKoboAsset(
    @Body()
    createKoboAssetData: CreateKoboDto,
    @Param('programId', ParseIntPipe)
    programId: number,
    @Query('dryRun', new ParseBoolPipe({ optional: true })) dryRun: boolean,
    @Res({ passthrough: true }) response: Response,
  ): Promise<KoboIntegrationResultDto> {
    const result = await this.koboService.integrateKobo({
      programId,
      assetUid: createKoboAssetData.assetUid,
      token: createKoboAssetData.token,
      url: createKoboAssetData.url,
      dryRun,
    });

    if (result.dryRun) {
      response.status(HttpStatus.OK);
    } else {
      response.status(HttpStatus.CREATED);
    }

    return {
      message: result.message,
      name: result.name,
    };
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get Kobo integration data for a Program',
    description:
      'Retrieves the current Kobo form integration details for the specified program, including asset ID, version ID, deployment date, and server URL.',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    description: 'The unique identifier of the program',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved Kobo integration data for the program',
    type: KoboResponseDto,
    example: {
      assetUid: 'aAbBcCdDeEfF123456789',
      versionId: 'vAbBcCdDeEfF987654321',
      dateDeployed: '2024-12-19T10:30:00Z',
      url: 'https://kobo.example.com',
      programId: 1,
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or no Kobo integration found for this program',
  })
  @Get('programs/:programId/kobo')
  public async getKoboData(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<KoboResponseDto> {
    return this.koboService.getKoboData({ programId });
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Import new Kobo submissions as registrations',
    description: `Fetches all submissions from the linked Kobo form, filters out submissions that have already been imported (by matching Kobo submission UUID against registration referenceId), and imports the remaining new submissions as registrations. Returns an error if the number of new submissions exceeds the maximum import limit (1000).`,
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    description: 'The unique identifier of the program',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'New submissions have been successfully imported as registrations',
    type: ImportResult,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No Kobo integration found for this program',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Too many new submissions to import. Use CSV import and split the data into smaller batches.',
  })
  @Patch('programs/:programId/kobo/submissions')
  public async importNewKoboSubmissions(
    @Param('programId', ParseIntPipe)
    programId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<ImportResult> {
    const userId = RequestHelper.getUserId(req);
    return this.koboSubmissionService.importNewSubmissions({
      programId,
      userId,
    });
  }

  @NoUserAuthenticationEndpoint(
    'This endpoint is called by Kobo and does not require user authentication',
  )
  @UseGuards(KoboWebhookBasicAuthGuard)
  @ApiSecurity('basic')
  @SkipThrottle() // Skip rate limiting as this endpoint is called by Kobo and we want to avoid rejecting calls due to rate limits
  @ApiOperation({
    summary: `Post a new kobo submission [USED BY KOBO]`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incoming submission processed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
  })
  @ApiBody({
    type: KoboWebhookIncomingSubmission,
  })
  @Post(`kobo/webhook`)
  public async processKoboWebhookCall(
    @Body() body: KoboWebhookIncomingSubmission,
  ) {
    await this.koboSubmissionService.processKoboWebhookCall(body);
  }
}
