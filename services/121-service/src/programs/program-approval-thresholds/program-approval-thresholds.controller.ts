import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/approval-thresholds')
@Controller()
export class ProgramApprovalThresholdsController {
  public constructor(
    private readonly programApprovalThresholdsService: ProgramApprovalThresholdsService,
  ) {}

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramUPDATE],
  })
  @ApiOperation({
    summary: 'Replace all approval thresholds for a program',
    description:
      'Replaces the entire threshold configuration. Deletes existing thresholds and creates new ones with their approvers.',
  })
  @ApiBody({
    description:
      'Array of approval thresholds with their approvers. Approval levels are automatically derived from thresholdAmount (sorted ascending).',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        required: ['thresholdAmount', 'approvers'],
        properties: {
          thresholdAmount: {
            type: 'number',
            description:
              'Payment amount threshold in program currency. Approval levels are computed by sorting these amounts ascending.',
            example: 3000,
          },
          approvers: {
            type: 'array',
            description: 'Array of approvers for this threshold level',
            items: {
              type: 'object',
              required: ['programAidworkerAssignmentId'],
              properties: {
                programAidworkerAssignmentId: {
                  type: 'integer',
                  description: 'ID of the program aidworker assignment',
                  example: 2,
                },
              },
            },
          },
        },
      },
      example: [
        {
          thresholdAmount: 3000,
          approvers: [
            { programAidworkerAssignmentId: 2 },
            { programAidworkerAssignmentId: 7 },
          ],
        },
        {
          thresholdAmount: 5000,
          approvers: [
            { programAidworkerAssignmentId: 3 },
            { programAidworkerAssignmentId: 5 },
          ],
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Program approval thresholds replaced successfully',
    type: [GetProgramApprovalThresholdResponseDto],
  })
  @Post('programs/:programId/approval-thresholds')
  public async replaceProgramApprovalThresholds(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() thresholds: CreateProgramApprovalThresholdDto[],
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    return await this.programApprovalThresholdsService.replaceProgramApprovalThresholds(
      programId,
      thresholds,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramREAD],
  })
  @ApiOperation({
    summary: 'Get all approval thresholds for a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved approval thresholds successfully',
    type: [GetProgramApprovalThresholdResponseDto],
  })
  @Get('programs/:programId/approval-thresholds')
  public async getProgramApprovalThresholds(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<GetProgramApprovalThresholdResponseDto[]> {
    return await this.programApprovalThresholdsService.getProgramApprovalThresholds(
      programId,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.ProgramUPDATE],
  })
  @ApiOperation({
    summary: 'Delete all approval thresholds for a program',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'All program approval thresholds deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('programs/:programId/approval-thresholds')
  public async deleteAllProgramApprovalThresholds(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<void> {
    return await this.programApprovalThresholdsService.deleteAllProgramApprovalThresholds(
      programId,
    );
  }
}
