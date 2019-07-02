import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  ManyToOne,
} from 'typeorm';
import { CriteriumEntity } from '../criterium/criterium.entity';

@Entity('option')
export class OptionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public option: string;

  @ManyToOne(type => CriteriumEntity, criterium => criterium.options)
  public criterium: CriteriumEntity;
}
