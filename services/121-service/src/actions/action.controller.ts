import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { Permissions } from '../guards/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionEnum } from '../user/enum/permission.enum';
import { User } from '../user/user.decorator';
import { ActionEntity, ActionType } from './action.entity';
import { ActionService } from './action.service';
import { ActionDto } from './dto/action.dto';

@UseGuards(PermissionsGuard)
@ApiTags('programs/actions')
@Controller()
export class ActionController {
  private readonly actionService: ActionService;
  public constructor(actionService: ActionService) {
    this.actionService = actionService;
  }

  @Permissions(PermissionEnum.ActionREAD)
  @ApiOperation({ summary: 'Get latest action of given action-type ' })
  @ApiResponse({
    status: 200,
    description: 'Returned latest action for given program-id and action-type.',
  })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiQuery({ name: 'actionType', required: true, type: 'string' })
  @Get('programs/:programId/actions')
  public async getLatestAction(
    @Param('programId') programId,
    @Query('actionType') actionType: ActionType,
  ): Promise<ActionEntity> {
    return await this.actionService.getLatestActions(
      Number(programId),
      actionType,
    );
  }

  // TODO: this endpoint is not used currently, remove it?
  @Permissions(PermissionEnum.ActionCREATE)
  @ApiOperation({ summary: 'Save action by id' })
  @ApiResponse({ status: 201, description: 'Action saved' })
  @ApiParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @Post('programs/:programId/actions')
  public async saveAction(
    @User('id') userId: number,
    @Body() actionData: ActionDto,
    @Param('programId') programId,
  ): Promise<ActionEntity> {
    return await this.actionService.saveAction(
      userId,
      Number(programId),
      actionData.actionType,
    );
  }
}
