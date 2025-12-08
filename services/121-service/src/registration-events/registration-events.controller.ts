import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { Paginate, PaginatedSwaggerDocs, PaginateQuery } from 'nestjs-paginate';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';
import { PaginateConfigRegistrationEventView } from '@121-service/src/registration-events/const/paginate-config-registration-event-view.const';
import { FindAllRegistrationEventsResultDto } from '@121-service/src/registration-events/dto/find-all-registration-events-result.dto';
import { GetRegistrationEventDto } from '@121-service/src/registration-events/dto/get-registration-event.dto';
import { GetRegistrationEventsQueryDto } from '@121-service/src/registration-events/dto/get-registration-event-query.dto';
import { RegistrationEventViewEntity } from '@121-service/src/registration-events/entities/registration-event.view.entity';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
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
  @ApiTags('programs/:programId/registration-events')
  @ApiOperation({ summary: 'Get list of registration events for query params' })
  @ApiParam({
    name: 'programId',
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
  @Get('programs/:programId/registration-events/export')
  public async getEvents(
    @Param('programId', ParseIntPipe) programId: number,
    @Query() queryParams: GetRegistrationEventsQueryDto,
    @Query('format') format = 'json',
    @Res() res: Response,
  ): Promise<GetRegistrationEventDto[] | void> {
    const searchOptions = {
      queryParams,
    };
    const result =
      await this.registrationEventsService.getRegistrationEventsExport({
        programId,
        searchOptions,
      });
    if (result.data.length === 0) {
      const errorNoData = 'There is currently no data to export';
      throw new HttpException({ errors: errorNoData }, HttpStatus.NOT_FOUND);
    }

    if (format === ExportFileFormat.xlsx) {
      // TODO: REFACTOR: nothing actually happens with this filename, it is overwritten in the front-end
      const filename = `registration-data-change-events`;
      return sendXlsxReponse(result.data, filename, res);
    }
    res.send(result);
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.RegistrationPersonalREAD] })
  @ApiOperation({
    summary:
      '[SCOPED] Get registration-events for the monitoring page (excludes type=status-change)',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @PaginatedSwaggerDocs(
    RegistrationEventViewEntity,
    PaginateConfigRegistrationEventView,
  )
  @Get('programs/:programId/registration-events/monitoring')
  public async getRegistrationEventsMonitoring(
    @Paginate() paginateQuery: PaginateQuery,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<FindAllRegistrationEventsResultDto> {
    return await this.registrationEventsService.getRegistrationEventsMonitoring(
      {
        programId,
        paginateQuery,
      },
    );
  }
}
