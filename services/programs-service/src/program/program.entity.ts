import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  AfterUpdate,
  BeforeUpdate,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('program')
export class ProgramEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public title: string;

  @Column({ default: '' })
  public description: string;

  @Column()
  public countryId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp() {
    this.updated = new Date();
  }

  @ManyToOne(type => UserEntity, user => user.programs)
  public author: UserEntity;
}
