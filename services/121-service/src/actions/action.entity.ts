import { ExportType } from './../programs/program/dto/export-details';
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

  @ManyToOne(
    type => UserEntity,
    user => user.actions,
  )
  public user: UserEntity;

  @ManyToOne(
    type => ProgramEntity,
    program => program.actions,
  )
  public program: ProgramEntity;
}

export type ActionType = ExportType | AdditionalActionType;

export enum AdditionalActionType {
  notifyIncluded = 'notify-included',
}

// Add both enum together to one array so it can be used as validator in the dto
export const ActionArray = Object.values(ExportType)
  .map(item => String(item))
  .concat(Object.values(AdditionalActionType).map(item => String(item)));
