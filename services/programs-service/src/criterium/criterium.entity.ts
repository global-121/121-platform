import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, OneToMany} from "typeorm";
import {IsEmail, Validate} from "class-validator";
import * as crypto from 'crypto';
import { Type } from "class-transformer";
import { OptionEntity } from '../option/option.entity';

@Entity('criterium')
export class CriteriumEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  criterium: string;

  @Column()
  answerType: string;

}
