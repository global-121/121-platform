import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne} from "typeorm";
import {IsEmail, Validate} from "class-validator";
import * as crypto from 'crypto';
import { Type } from "class-transformer";
import { CriteriumEntity } from '../criterium/criterium.entity';

@Entity('option')
export class OptionEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  option: string;

  // @ManyToOne(type => CriteriumEntity, criterium => criterium.options)
  // criterium: CriteriumEntity;

}
