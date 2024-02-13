import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../../guards/permissions.decorator';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { PermissionEnum } from '../../../user/enum/permission.enum';
import { RegistrationChangeLogReturnDto } from './dto/registration-change-log-return.dto';
import { RegistrationChangeLogService } from './registration-change-log.service';

@UseGuards(PermissionsGuard)
@ApiTags('programs/registrations')
@Controller()
export class RegistrationChangeLogController {
  public constructor(
    private registrationChangeLogService: RegistrationChangeLogService,
  ) {}

  // NOTE: REFACTOR: rename endpoint to /api/programs/:programid/registration-changes with OPTIONAL referenceID query param (OR: only rename AND add endpoint /api/programs/:programid/registration/:registrationid/changes)
  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: '[SCOPED] Get changelog for registration' })
  @ApiResponse({
    status: 200,
    description:
      'Get changelog for registration - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: [RegistrationChangeLogReturnDto],
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @Get('programs/:programId/registration-change-logs')
  public async getChangeLog(
    @Param() params,
    @Query() queryParams,
  ): Promise<RegistrationChangeLogReturnDto[]> {
    if (!queryParams.referenceId) {
      throw new HttpException(
        'ReferenceId is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.registrationChangeLogService.getChangeLogByReferenceId(
      queryParams.referenceId,
      Number(params.programId),
    );
  }
}
