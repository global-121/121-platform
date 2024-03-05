import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '../guards/authenticated-user.guard';
import { PermissionEnum } from '../user/enum/permission.enum';
import { ActionType } from './action.entity';
import { ActionService } from './action.service';
import { ActionReturnDto } from './dto/action-return.dto';
import { ActionDto } from './dto/action.dto';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs/actions')
@Controller()
export class ActionController {
  private readonly actionService: ActionService;
  public constructor(actionService: ActionService) {
    this.actionService = actionService;
  }

  @AuthenticatedUser({ permissions: [PermissionEnum.ActionREAD] })
  @ApiOperation({ summary: 'Get latest action of given action-type ' })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Returned latest action for given program-id and action-type.',
    type: ActionReturnDto,
  })
  @ApiQuery({ name: 'actionType', required: true, type: 'string' })
  @Get('programs/:programId/actions')
  public async getLatestAction(
    @Param('programId') programId,
    @Query('actionType') actionType: ActionType,
  ): Promise<ActionReturnDto> {
    return await this.actionService.getLatestAction(
      Number(programId),
      actionType,
    );
  }

  // TODO: this endpoint is not used currently, remove it?
  @AuthenticatedUser({ permissions: [PermissionEnum.ActionCREATE] })
  @ApiOperation({ summary: 'Save action by id' })
  @ApiResponse({
    status: 201,
    description: 'Action saved',
    type: ActionReturnDto,
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @Post('programs/:programId/actions')
  public async saveAction(
    @Req() req: any,
    @Body() actionData: ActionDto,
    @Param('programId') programId,
  ): Promise<ActionReturnDto> {
    const userId = req.user.id;
    return await this.actionService.postAction(
      userId,
      Number(programId),
      actionData.actionType,
    );
  }
}
