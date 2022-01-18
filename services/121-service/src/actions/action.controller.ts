import { Post, Body, Controller, UseGuards } from '@nestjs/common';
import { ActionService } from './action.service';
import { User } from '../user/user.decorator';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { RolesGuard } from '../roles.guard';
import { ActionDto } from './dto/action.dto';
import { ActionEntity } from './action.entity';
import { DefaultUserRole } from '../user/user-role.enum';
import { Roles } from '../roles.decorator';
import { PermissionsGuard } from '../permissions.guard';
import { Permissions } from '../permissions.decorator';
import { PermissionEnum } from '../user/permission.enum';

@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@ApiUseTags('actions')
@Controller('actions')
export class ActionController {
  private readonly actionService: ActionService;
  public constructor(actionService: ActionService) {
    this.actionService = actionService;
  }

  @Roles(
    DefaultUserRole.RunProgram,
    DefaultUserRole.PersonalData,
    DefaultUserRole.View,
  )
  @Permissions(PermissionEnum.ActionREAD)
  @ApiOperation({ title: 'Get latest action of type ' })
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

  @Roles(DefaultUserRole.RunProgram, DefaultUserRole.PersonalData)
  @Permissions(PermissionEnum.ActionCREATE)
  @ApiOperation({ title: 'Save action by id' })
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
