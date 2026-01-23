import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ApproverService } from '@121-service/src/user/approver/approver.service';
import { ApproverResponseDto } from '@121-service/src/user/approver/dto/approver-response.dto';
import { CreateApproverDto } from '@121-service/src/user/approver/dto/create-approver.dto';
import { UpdateApproverDto } from '@121-service/src/user/approver/dto/update-approver.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/approvers')
@Controller()
export class ApproverController {
  public constructor(private readonly approverService: ApproverService) {}

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramREAD] })
  @ApiOperation({ summary: 'Get all approvers for program' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of approvers',
    type: [ApproverResponseDto],
  })
  @ApiParam({ name: 'programId', required: true })
  @Get('programs/:programId/approvers')
  public async getApprovers(
    @Param('programId', ParseIntPipe) programId: number,
  ): Promise<ApproverResponseDto[]> {
    return await this.approverService.getApprovers({ programId });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiOperation({ summary: 'Create a new approver' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Returns the created approver and their permissions',
    type: ApproverResponseDto,
  })
  @ApiParam({ name: 'programId', required: true })
  @Post('programs/:programId/approvers')
  public async createApprover(
    @Param('programId', ParseIntPipe) programId: number,
    @Body() body: CreateApproverDto,
  ): Promise<ApproverResponseDto> {
    return await this.approverService.createApprover({
      programId,
      userId: body.userId,
      order: body.order,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiOperation({ summary: 'Update an existing approver' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the updated approver ',
    type: ApproverResponseDto,
  })
  @ApiParam({ name: 'programId', required: true })
  @ApiParam({ name: 'approverId', required: true })
  @Patch('programs/:programId/approvers/:approverId')
  public async updateApprover(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('approverId', ParseIntPipe) approverId: number,
    @Body() body: UpdateApproverDto,
  ): Promise<ApproverResponseDto> {
    return await this.approverService.updateApprover({
      programId,
      approverId,
      order: body.order,
    });
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.AidWorkerProgramUPDATE] })
  @ApiOperation({ summary: 'Delete an existing approver' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Approver successfully deleted',
  })
  @ApiParam({ name: 'programId', required: true })
  @ApiParam({ name: 'approverId', required: true })
  @Delete('programs/:programId/approvers/:approverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteApprover(
    @Param('programId', ParseIntPipe) programId: number,
    @Param('approverId', ParseIntPipe) approverId: number,
  ): Promise<void> {
    return await this.approverService.deleteApprover({ programId, approverId });
  }
}
