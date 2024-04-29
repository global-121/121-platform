import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { ActionEntity, ActionType } from './action.entity';
import { ActionReturnDto } from './dto/action-return.dto';
import { ActionMapper } from './utils/action.mapper';

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
      where: { id: savedAction.id },
      relations: ['user'],
    });
    return ActionMapper.entityToActionReturnDto(actionWithRelations);
  }

  public async saveAction(
    userId: number,
    programId: number,
    actionType: ActionType,
  ): Promise<ActionEntity> {
    const action = new ActionEntity();
    action.actionType = actionType;
    const user = await this.userRepository.findOneBy({
      id: userId,
    });
    action.user = user;

    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    action.program = program;

    return await this.actionRepository.save(action);
  }

  public async getLatestAction(
    programId: number,
    actionType: ActionType,
  ): Promise<ActionReturnDto> {
    const action = await this.actionRepository.findOne({
      where: { program: { id: programId }, actionType: actionType },
      relations: ['user'],
      order: { created: 'DESC' },
    });
    if (action && action.user) {
      return ActionMapper.entityToActionReturnDto(action);
    }

    return null;
  }
}
