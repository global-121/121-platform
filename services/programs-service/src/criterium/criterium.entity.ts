import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeUpdate,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { OptionEntity } from '../option/option.entity';

@Entity('criterium')
export class CriteriumEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public criterium: string;

  @Column()
  public answerType: string;

  @Column()
  public criteriumType: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @ManyToOne(type => UserEntity, user => user.criteriums)
  public author: UserEntity;

  @OneToMany(type => OptionEntity, option => option.criterium)
  public options: OptionEntity[];
}
