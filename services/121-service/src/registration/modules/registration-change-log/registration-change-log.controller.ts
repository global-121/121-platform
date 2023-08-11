import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../../guards/permissions.decorator';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { PermissionEnum } from '../../../user/permission.enum';
import { RegistrationChangeLogService } from './registration-change-log.service';

@UseGuards(PermissionsGuard)
@ApiTags('registration-change-log')
@Controller()
export class RegistrationChangeLogController {
  public constructor(
    private registrationChangeLogService: RegistrationChangeLogService,
  ) {}

  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: 'Get changelog for registration' })
  @ApiResponse({ status: 200, description: 'Get changelog for registration' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'referenceId', required: true })
  @Get('programs/:programId/registration-change-log/:referenceId')
  public async getChangeLog(@Param() params): Promise<any> {
    return await this.registrationChangeLogService.getChangeLogByReferenceId(
      params.referenceId,
    );
  }
}
