import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ProgramEntity } from '../programs/program/program.entity';

@Entity('action')
export class ActionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public actionType: ActionType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @ManyToOne(type => UserEntity, user => user.actions)
  public user: UserEntity;

  @ManyToOne(type => ProgramEntity, program => program.actions)
  public program: ProgramEntity;
}

export enum ActionType {
  notifyIncluded = 'notify-included',
}
