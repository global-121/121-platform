import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetEventDto } from './dto/getEvent.dto';
import { EventGetService } from './events-get/events.get.service';

@ApiTags('1programs/events')
@Controller()
export class EventController {
  public constructor(private readonly eventService: EventGetService) {}

  @ApiOperation({ summary: 'Get list of events for a specific referenceId' })
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
  @ApiQuery({ name: 'referenceId', required: true, type: 'string' })
  @Get('programs/:programId/events')
  public async getEvents(
    @Param('programId') programId,
    @Query('referenceId') referenceId: string,
  ): Promise<GetEventDto[]> {
    return await this.eventService.getEvents(Number(programId), referenceId);
  }
}
