import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
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

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { GetProgramAidworkerAssignmentResponseDto } from '@121-service/src/programs/program-aidworker-assignments/dtos/get-program-aidworker-assignment-response.dto';
import { ProgramAidworkerAssignmentsService } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignments.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/aidworker-assignments')
@Controller()
export class ProgramAidworkerAssignmentsController {
  public constructor(
    private readonly programAidworkerAssignmentsService: ProgramAidworkerAssignmentsService,
  ) {}

  @ApiOperation({
    summary: 'Get aidworker assignment by user ID',
  })
  @ApiParam({
    name: 'programId',
    type: 'integer',
    description: 'Program ID',
  })
  @ApiQuery({
    name: 'userId',
    type: 'integer',
    description: 'User ID',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aidworker assignment found',
    type: GetProgramAidworkerAssignmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aidworker assignment not found',
  })
  @Get('programs/:programId/aidworker-assignments')
  @AuthenticatedUser({ isAdmin: true })
  public async getAidworkerAssignment(
    @Param('programId', ParseIntPipe) programId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<GetProgramAidworkerAssignmentResponseDto> {
    const assignment =
      await this.programAidworkerAssignmentsService.getAssignmentByUserId({
        userId,
        programId,
      });

    if (!assignment) {
      throw new NotFoundException(
        `Aidworker assignment not found for user ${userId} in program ${programId}`,
      );
    }

    return assignment;
  }
}
