import { UserEntity } from '../user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Index,
} from 'typeorm';
import { PaDataTypes } from './enum/padata-types.enum';
import { Base121Entity } from '../base.entity';

@Entity('people_affected_app_data')
export class PersonAffectedAppDataEntity extends Base121Entity {
  @Index()
  @Column()
  public type: PaDataTypes;

  @Column()
  public data: string;

  @ManyToOne(
    () => UserEntity,
    user => user.personAffectedAppData,
  )
  public user: UserEntity;
}
