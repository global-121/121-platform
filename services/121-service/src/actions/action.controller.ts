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

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('actions')
@Controller('actions')
export class ActionController {
  private readonly actionService: ActionService;
  public constructor(actionService: ActionService) {
    this.actionService = actionService;
  }

  @ApiOperation({ title: 'Get actions by program-id and action-type' })
  @ApiResponse({
    status: 200,
    description: 'Returned actions for given program-id and action-type.',
  })
  @Post('retrieve')
  public async getActions(
    @Body() actionData: ActionDto,
  ): Promise<ActionEntity[]> {
    return await this.actionService.getActions(
      actionData.programId,
      actionData.actionType,
    );
  }

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
