import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { KoboIntegrationResultDto } from '@121-service/src/kobo/dtos/kobo-integration-result.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/kobo')
@Controller('programs')
export class KoboController {
  public constructor(private readonly koboService: KoboService) {}

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
  @Post(':programId/kobo')
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
  @Get(':programId/kobo')
  public async getKoboData(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<KoboResponseDto> {
    return this.koboService.getKoboData({ programId });
  }
}
