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
  public totalFunds: number;

  @Column()
  public transferredFunds: number;

  @Column()
  public availableFunds: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.timestamp = new Date();
  }

  @OneToOne(type => ProgramEntity, program => program.funds)
  @JoinColumn()
  public program: ProgramEntity;

}
