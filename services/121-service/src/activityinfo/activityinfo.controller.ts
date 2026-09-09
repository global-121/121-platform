import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { ActivityInfoIntegrationResultDto } from '@121-service/src/activityinfo/dtos/activityinfo-integration-result.dto';
import { ActivityInfoResponseDto } from '@121-service/src/activityinfo/dtos/activityinfo-response.dto';
import { CreateActivityInfoDto } from '@121-service/src/activityinfo/dtos/create-activityinfo.dto';
import { ImportExistingRecordsResultDto } from '@121-service/src/activityinfo/dtos/import-existing-records-result.dto';
import { ActivityInfoService } from '@121-service/src/activityinfo/services/activityinfo.service';
import { ActivityInfoRecordService } from '@121-service/src/activityinfo/services/activityinfo-record.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { MAX_REGISTRATION_IMPORT_ROWS_PER_UPLOAD } from '@121-service/src/shared/file-upload-row-limits';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/activityinfo')
@Controller()
export class ActivityInfoController {
  public constructor(
    private readonly activityInfoService: ActivityInfoService,
    private readonly activityInfoRecordService: ActivityInfoRecordService,
  ) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramActivityInfoUPDATE] })
  @ApiOperation({
    summary: 'Integrate an ActivityInfo form with a Program',
    description: `Integrates an ActivityInfo form with the specified program. This will:
    - Validate the form schema against program requirements and FSP configurations
    - Import form fields as program registration attributes, keyed on the immutable ActivityInfo field id
    - Create or update the ActivityInfo integration record
    Use dryRun=true to validate the integration without making changes.`,
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
    description: 'The unique identifier of the program to integrate with',
    example: 1,
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: 'boolean',
    description:
      'When set to "true", validates the integration without making any changes to the program. Returns 200 if validation passes, or an appropriate error status if validation fails.',
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'The ActivityInfo form has been successfully integrated with the program',
    type: ActivityInfoIntegrationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dry run completed successfully - the integration would succeed if executed',
    type: ActivityInfoIntegrationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Validation failed - the ActivityInfo form does not meet program requirements',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'User is not authenticated, or the ActivityInfo API token is invalid',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Program does not exist, or the ActivityInfo form was not found',
  })
  @Put('programs/:programId/activityinfo')
  public async createActivityInfoIntegration(
    @Body() createActivityInfoData: CreateActivityInfoDto,
    @Param('programId', ParseIntPipe) programId: number,
    @Query('dryRun', new ParseBoolPipe({ optional: true })) dryRun: boolean,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActivityInfoIntegrationResultDto> {
    const result = await this.activityInfoService.integrateActivityInfo({
      programId,
      formId: createActivityInfoData.formId,
      token: createActivityInfoData.token,
      url: createActivityInfoData.url,
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

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramActivityInfoREAD] })
  @ApiOperation({
    summary: 'Get ActivityInfo integration data for a Program',
    description:
      'Retrieves the current ActivityInfo form integration details for the specified program, including form id, schema version and server URL.',
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
      'Successfully retrieved ActivityInfo integration data for the program',
    type: ActivityInfoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Program does not exist or no ActivityInfo integration found for this program',
  })
  @Get('programs/:programId/activityinfo')
  public async getActivityInfoData(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<ActivityInfoResponseDto> {
    return this.activityInfoService.getActivityInfoData({ programId });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramActivityInfoUPDATE] })
  @ApiOperation({
    summary: 'Refresh the ActivityInfo form integration for a Program',
    description:
      'Fetches the latest ActivityInfo form schema and updates the program registration attributes accordingly. Fields are matched on their immutable ActivityInfo field id, so a renamed field code renames the existing attribute instead of creating a new one.',
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
      'Refresh completed. Inspect the `updated` field to determine whether changes were applied or the form was already up to date.',
    type: ActivityInfoIntegrationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Validation failed - the latest form schema does not meet program requirements',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No ActivityInfo integration found for this program',
  })
  @Patch('programs/:programId/activityinfo')
  public async refreshActivityInfoForm(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<ActivityInfoIntegrationResultDto> {
    const result = await this.activityInfoService.refreshActivityInfoForm({
      programId,
    });

    return {
      message: result.updated
        ? 'ActivityInfo form refreshed successfully'
        : 'ActivityInfo form is already up to date',
      name: result.name,
      updated: result.updated,
    };
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ProgramActivityInfoUPDATE] })
  @ApiOperation({
    summary: 'Import existing ActivityInfo records as registrations',
    description: `Fetches all records from the linked ActivityInfo form, filters out records that have already been imported (by matching the ActivityInfo record id against the registration referenceId), and imports the remaining records as registrations. Returns an error if the number of records exceeds the maximum of ${MAX_REGISTRATION_IMPORT_ROWS_PER_UPLOAD}.`,
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
    description: 'Existing records have been successfully imported',
    type: ImportExistingRecordsResultDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No ActivityInfo integration found for this program',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Too many records to import. Use CSV import and split the data into smaller batches.',
  })
  @Patch('programs/:programId/activityinfo/records')
  public async importExistingRecords(
    @Param('programId', ParseIntPipe) programId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<ImportExistingRecordsResultDto> {
    const userId = RequestHelper.getUserId(req);

    return this.activityInfoRecordService.importExistingRecords({
      programId,
      userId,
    });
  }
}
