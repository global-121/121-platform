import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { ProgramEntity } from './program.entity';

@Entity()
export class CustomCriterium {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Index({ unique: true })
  public criterium: string;

  @Column('json')
  public label: JSON;

  @Column()
  public answerType: string;

  @Column('json', { nullable: true })
  public placeholder: JSON;

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

  @ManyToOne(
    _type => ProgramEntity,
    program => program.customCriteria,
  )
  public program: ProgramEntity;

  @Column({ default: false })
  public persistence: boolean;

  @Column('json', {
    default: ['all-people-affected', 'included', 'selected-for-validation'],
  })
  public export: JSON;

  @Column({ nullable: true })
  public pattern: string;
}
