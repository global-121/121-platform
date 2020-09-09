import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeUpdate,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from '../../user/user.entity';

@Entity('standard_criterium')
export class StandardCriteriumEntity {
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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @ManyToOne(
    type => UserEntity,
    user => user.criteriums,
  )
  public author: UserEntity;
}
