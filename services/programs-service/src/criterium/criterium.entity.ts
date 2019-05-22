import {Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, ManyToOne, OneToMany} from "typeorm";
import { UserEntity } from '../user/user.entity';
import { OptionEntity } from "../option/option.entity";

@Entity('criterium')
export class CriteriumEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  criterium: string;

  @Column()
  answerType: string;

  @Column()
  criteriumType: string;

  @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP"})
  created: Date;

  @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP"})
  updated: Date;

  @BeforeUpdate()
  updateTimestamp() {
    this.updated = new Date;
  }

  @ManyToOne(type => UserEntity, user => user.criteriums)
  author: UserEntity;

  @OneToMany(type => OptionEntity, option => option.criterium)
  options: OptionEntity[];

}
