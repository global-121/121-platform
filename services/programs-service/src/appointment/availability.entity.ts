import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BeforeUpdate,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('availability')
export class AvailabilityEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public startDate: Date;

  @Column()
  public endDate: Date;

  @Column()
  public location: string;

  @ManyToOne(type => UserEntity, user => user.availability)
  public aidworker: UserEntity;

}
