import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExportFileFormat } from '../metrics/enum/export-file-format.enum';
import { GetEventDto } from './dto/get-event.dto';
import { EventGetService } from './events-get/events.get.service';

@Controller()
export class EventController {
  public constructor(private readonly eventService: EventGetService) {}

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
  ): Promise<GetEventDto[]> {
    return await this.eventService.getEvents(programId, { queryParams });
  }

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
    return await this.eventService.getEvents(programId, { registrationId });
  }
}
