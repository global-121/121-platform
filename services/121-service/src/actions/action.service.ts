import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserEntity } from '../user/user.entity';

import { ActionEntity, ActionType } from './action.entity';

@Injectable()
export class ActionService {
  @InjectRepository(ActionEntity)
  private readonly actionRepository: Repository<ActionEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor() {}

  public async saveAction(
    userId: number,
    programId: number,
    actionType: ActionType,
  ): Promise<ActionEntity> {
    let action = new ActionEntity();
    action.actionType = actionType;

    const user = await this.userRepository.findOne(userId);
    action.user = user;

    const program = await this.programRepository.findOne(programId);
    action.program = program;

    const newAction = await this.actionRepository.save(action);
    return newAction;
  }

  public async getActions(
    programId: number,
    actionType: ActionType,
  ): Promise<ActionEntity[]> {
    const actions = await this.actionRepository.find({
      where: { programId: programId, actionType: actionType },
    });

    return actions;
  }
}
