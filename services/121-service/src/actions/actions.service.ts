import {
  ActionEntity,
  ActionType,
} from '@121-service/src/actions/action.entity';
import { ActionReturnDto } from '@121-service/src/actions/dto/action-return.dto';
import { ActionMapper } from '@121-service/src/actions/utils/action.mapper';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class ActionsService {
  @InjectRepository(ActionEntity)
  private readonly actionRepository: Repository<ActionEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public async postAction(
    userId: number,
    programId: number,
    actionType: ActionType,
  ): Promise<ActionReturnDto> {
    const savedAction = await this.saveAction(userId, programId, actionType);
    const actionWithRelations = await this.actionRepository.findOne({
      where: { id: Equal(savedAction.id) },
      relations: ['user'],
    });
    return ActionMapper.entityToActionReturnDto(actionWithRelations!);
  }

  public async saveAction(
    userId: number,
    programId: number,
    actionType: ActionType,
  ): Promise<ActionEntity> {
    const action = new ActionEntity();
    action.actionType = actionType;
    const user = await this.userRepository.findOneByOrFail({
      id: userId,
    });

    action.user = user;

    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });

    action.program = program;

    return await this.actionRepository.save(action);
  }

  public async getLatestAction(
    programId: number,
    actionType: ActionType,
  ): Promise<ActionReturnDto | null> {
    const action = await this.actionRepository.findOne({
      where: {
        program: { id: Equal(programId) },
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
