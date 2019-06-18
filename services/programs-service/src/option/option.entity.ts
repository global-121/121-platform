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
  id: number;

  @Column()
  option: string;

  @ManyToOne(type => CriteriumEntity, criterium => criterium.options)
  criterium: CriteriumEntity;
}
