import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BeforeUpdate,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('appointment')
export class AppointmentEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public timeslotId: number;

}
