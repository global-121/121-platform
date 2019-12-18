import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeUpdate,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ProgramEntity } from './program.entity';

@Entity('funds')
export class FundsEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public totalRaised: number;

  @Column()
  public totalTransferred: number;

  @Column()
  public totalAvailable: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @OneToOne(type => ProgramEntity, program => program.funds)
  @JoinColumn()
  public program: ProgramEntity;

}
