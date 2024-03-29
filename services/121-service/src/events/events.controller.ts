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
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { ExportFileFormat } from '../metrics/enum/export-file-format.enum';
import { PermissionEnum } from '../user/enum/permission.enum';
import { sendXlsxReponse } from '../utils/send-xlsx-response';
import { GetEventDto } from './dto/get-event.dto';
import { EventsService } from './events.service';

@UseGuards(PermissionsGuard)
@Controller()
export class EventsController {
  public constructor(private readonly eventService: EventsService) {}

  // We can later extend these permissions to different types when we get more types of events
  @Permissions(PermissionEnum.RegistrationPersonalEXPORT)
  @ApiTags('programs/events')
  @ApiOperation({ summary: 'Get list of events for query params' })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Returned list of events for given referenceId.',
    type: [GetEventDto],
  })
  @ApiQuery({ name: 'referenceId', required: false, type: 'string' })
  @ApiQuery({ name: 'fromDate', required: false, type: 'string' })
  @ApiQuery({ name: 'toDate', required: false, type: 'string' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ExportFileFormat,
    description:
      'Format to return the data in. Options are "json" and "xlsx". Defaults to "json" if not specified. If "xlsx" is selected, the response will be a file download in which the data is slightly differently formatted for portal users in ',
  })
  @Get('programs/:programId/events')
  public async getEvents(
    @Param('programId', ParseIntPipe) programId: number,
    @Query() queryParams: Record<string, string>,
    @Query('format') format = 'json',
    @Res() res,
  ): Promise<GetEventDto[] | void> {
    // REFACTOR: nothing actually happens with this filename, it is overwritten in the front-end
    const filename = `registration-data-change-events`;
    const searchOptions = {
      queryParams: queryParams,
    };
    const errorNoData = 'There is currently no data to export';
    if (format === ExportFileFormat.xlsx) {
      const result = await this.eventService.getEventsXlsxDto(
        programId,
        searchOptions,
      );
      if (result.length === 0) {
        throw new HttpException({ errors: errorNoData }, HttpStatus.NOT_FOUND);
      }
      return sendXlsxReponse(result, filename, res);
    }
    const result = await this.eventService.getEventsJsonDto(
      programId,
      searchOptions,
    );
    if (result.length === 0) {
      throw new HttpException({ errors: errorNoData }, HttpStatus.NOT_FOUND);
    }
    return res.send(result);
  }

  // We can later extend these permissions to different types when we get more types of events
  @Permissions(PermissionEnum.RegistrationPersonalREAD)
  @ApiOperation({ summary: 'Get list of events for a specific registrationId' })
  @ApiParam({
    name: 'registrationId',
    required: true,
    type: 'integer',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Returned list of events for given registrationId.',
    type: [GetEventDto],
  })
  @ApiTags('programs/registrations')
  @Get('programs/:programId/registrations/:registrationId/events')
  public async getEventsByRegistrationId(
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<GetEventDto[]> {
    return await this.eventService.getEventsJsonDto(programId, {
      registrationId,
    });
  }
}
