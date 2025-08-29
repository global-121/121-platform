import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import {
  ActionEntity,
  ActionType,
} from '@121-service/src/actions/action.entity';
import { ActionReturnDto } from '@121-service/src/actions/dto/action-return.dto';
import { ActionMapper } from '@121-service/src/actions/utils/action.mapper';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { UserEntity } from '@121-service/src/user/user.entity';

@Injectable()
export class ActionsService {
  @InjectRepository(ActionEntity)
  private readonly actionRepository: Repository<ActionEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;

  public async postAction(
    userId: number,
    projectId: number,
    actionType: ActionType,
  ): Promise<ActionReturnDto> {
    const savedAction = await this.saveAction(userId, projectId, actionType);
    const actionWithRelations = await this.actionRepository.findOne({
      where: { id: Equal(savedAction.id) },
      relations: ['user'],
    });
    return ActionMapper.entityToActionReturnDto(actionWithRelations!);
  }

  public async saveAction(
    userId: number,
    projectId: number,
    actionType: ActionType,
  ): Promise<ActionEntity> {
    const action = new ActionEntity();
    action.actionType = actionType;
    const user = await this.userRepository.findOneByOrFail({
      id: userId,
    });

    action.user = user;

    const project = await this.projectRepository.findOneByOrFail({
      id: projectId,
    });

    action.project = project;

    return await this.actionRepository.save(action);
  }

  public async getLatestAction(
    projectId: number,
    actionType: ActionType,
  ): Promise<ActionReturnDto | null> {
    const action = await this.actionRepository.findOne({
      where: {
        project: { id: Equal(projectId) },
        actionType: Equal(actionType),
      },
      relations: ['user'],
      order: { created: 'DESC' },
    });
    if (action && action.user) {
      return ActionMapper.entityToActionReturnDto(action);
    }

    return null;
  }
}
