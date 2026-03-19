import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AirtelAccountManagementService } from '@121-service/src/fsp-integrations/account-management/airtel/airtel-account-management.service';
import { AirtelUserLookupReportDto } from '@121-service/src/fsp-integrations/account-management/airtel/dtos/airtel-user-lookup-report.dto';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/airtel')
@Controller()
export class AirtelAccountManagementController {
  public constructor(
    private readonly airtelAccountManagementService: AirtelAccountManagementService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Retrieving and updating/inserting user lookup data from Airtel for all registrations in this program.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/inserting Airtel user lookup data for all registrations in this program.',
    type: Number,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Put('programs/:programId/fsps/airtel/users')
  public async retrieveAndUpsertUserLookupsForProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<number> {
    return this.airtelAccountManagementService.retrieveAndUpsertUserLookupsForProgram(
      { programId },
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationPersonalREAD],
  })
  @ApiOperation({
    summary:
      '[SCOPED] Returns a list of Registrations with the latest retrieved user lookup data from Airtel',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'An array of Registrations with the latest retrieved user lookup data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: AirtelUserLookupReportDto,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get('programs/:programId/fsps/airtel/users')
  public async getUserLookupReport(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<AirtelUserLookupReportDto> {
    return this.airtelAccountManagementService.getUserLookupReport({
      programId,
    });
  }
}
