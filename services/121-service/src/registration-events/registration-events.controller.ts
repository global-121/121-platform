import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Req,
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
import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';
import { GetRegistrationEventDto } from '@121-service/src/registration-events/dto/get-registration-event.dto';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { sendXlsxReponse } from '@121-service/src/utils/send-xlsx-response';

@UseGuards(AuthenticatedUserGuard)
@Controller()
export class RegistrationEventsController {
  public constructor(
    private readonly registrationEventsService: RegistrationEventsService,
  ) {}

  // We can later extend these permissions to different types when we get more types of events
  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationPersonalEXPORT],
  })
  @ApiTags('projects/:projectId/registration-events')
  @ApiOperation({ summary: 'Get list of registration events for query params' })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returned list of registration events for given referenceId.',
    type: [GetRegistrationEventDto],
  })
  @ApiQuery({ name: 'referenceId', required: false, type: 'string' })
  @ApiQuery({ name: 'fromDate', required: false, type: 'string' })
  @ApiQuery({ name: 'toDate', required: false, type: 'string' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ExportFileFormat,
    description:
      'Format to return the data in. Options are "json" and "xlsx". Defaults to "json" if not specified. If "xlsx" is selected, the response will be a file download in which the data is slightly differently formatted for portal users.',
  })
  @Get('projects/:projectId/registration-events')
  public async getEvents(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() queryParams: Record<string, string>,
    @Query('format') format = 'json',
    @Req() req: ScopedUserRequest,
    @Res() res: Response,
  ): Promise<GetRegistrationEventDto[] | void> {
    // TODO: REFACTOR: nothing actually happens with this filename, it is overwritten in the front-end
    const filename = `registration-data-change-events`;
    const searchOptions = {
      queryParams,
    };
    const errorNoData = 'There is currently no data to export';
    if (format === ExportFileFormat.xlsx) {
      const result = await this.registrationEventsService.getEventsAsXlsx({
        projectId,
        searchOptions,
      });
      if (result.length === 0) {
        throw new HttpException({ errors: errorNoData }, HttpStatus.NOT_FOUND);
      }
      return sendXlsxReponse(result, filename, res);
    }

    const result = await this.registrationEventsService.getEventsAsJson({
      projectId,
      searchOptions,
    });
    if (result.length === 0) {
      throw new HttpException({ errors: errorNoData }, HttpStatus.NOT_FOUND);
    }
    res.send(result);
  }
}
