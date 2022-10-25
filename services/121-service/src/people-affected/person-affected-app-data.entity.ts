import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { UserEntity } from '../user/user.entity';
import { PaDataTypes } from './enum/padata-types.enum';

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
