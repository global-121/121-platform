import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/registrations')
@Controller()
export class ActivitiesController {
  // TODO: Should this just be authenticated? Result is already guarded by permission
  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationPersonalREAD] })
  @ApiOperation({ summary: '[SCOPED] Get activities for registration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'TODO: Provide description',
    // type: [ResponseNoteDto],
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiParam({ name: 'registrationId', required: true, type: 'string' })
  @Get('programs/:programId/registrations/:registrationId/activities')
  public async getActivitiesByRegistrationId(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('registrationId') registrationId: string,
  ): Promise<void> {
    console.log(
      'TODO: Implement getActivitiesByRegistrationId',
      programId,
      registrationId,
    );
  }
}
