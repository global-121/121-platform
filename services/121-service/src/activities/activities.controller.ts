import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ActivitiesService } from '@121-service/src/activities/activities.service';
import { ActivitiesDto } from '@121-service/src/activities/dtos/activities.dto';
import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('projects/registrations')
@Controller()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}
  @AuthenticatedUser()
  @ApiOperation({ summary: '[SCOPED] Get activities for registration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: `Returns activities (${Object.values(ActivityTypeEnum).join(', ')}) for registration`,
    type: [ActivitiesDto],
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @ApiParam({ name: 'registrationId', required: true, type: 'integer' })
  @Get('projects/:projectId/registrations/:registrationId/activities')
  public async getActivitiesByRegistrationId(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @Req() req: ScopedUserRequest,
  ): Promise<ActivitiesDto> {
    const userId = RequestHelper.getUserId(req);

    return await this.activitiesService.getByRegistrationIdAndProjectId({
      registrationId,
      projectId,
      userId,
    });
  }
}
