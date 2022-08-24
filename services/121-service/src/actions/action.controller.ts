import { Post, Body, Controller, UseGuards } from '@nestjs/common';
import { ActionService } from './action.service';
import { User } from '../user/user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ActionDto } from './dto/action.dto';
import { ActionEntity } from './action.entity';
import { PermissionsGuard } from '../permissions.guard';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';

@UseGuards(PermissionsGuard)
@ApiTags('actions')
@Controller('actions')
export class ActionController {
  private readonly actionService: ActionService;
  public constructor(actionService: ActionService) {
    this.actionService = actionService;
  }

  @Permissions(PermissionEnum.ActionREAD)
  @ApiOperation({ summary: 'Get latest action of type ' })
  @ApiResponse({
    status: 200,
    description: 'Returned latest action for given program-id and action-type.',
  })
  @Post('retrieve-latest')
  public async getLatestAction(
    @Body() actionData: ActionDto,
  ): Promise<ActionEntity> {
    return await this.actionService.getLatestActions(
      actionData.programId,
      actionData.actionType,
    );
  }

  @Permissions(PermissionEnum.ActionCREATE)
  @ApiOperation({ summary: 'Save action by id' })
  @ApiResponse({ status: 200, description: 'Action saved' })
  @Post('save')
  public async saveAction(
    @User('id') userId: number,
    @Body() actionData: ActionDto,
  ): Promise<ActionEntity> {
    return await this.actionService.saveAction(
      userId,
      actionData.programId,
      actionData.actionType,
    );
  }
}
