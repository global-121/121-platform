import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BeforeUpdate,
} from 'typeorm';
import { ProgramEntity } from './program.entity';

@Entity()
export class CustomCriterium {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public criterium: string;

  @Column('json')
  public question: JSON;

  @Column()
  public answerType: string;

  @Column()
  public criteriumType: string;

  @Column('json', { nullable: true })
  public options: JSON;

  @Column('json')
  public scoring: JSON;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @ManyToOne(_type => ProgramEntity, program => program.customCriteria)
  public program: ProgramEntity;
}
