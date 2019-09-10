import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('data-storage')
export class DataStorageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public userId: number;

  @Column()
  public type: string;

  @Column()
  public data: string;

  @ManyToOne(type => UserEntity, user => user.dataObjects)
  public user: UserEntity;

}
