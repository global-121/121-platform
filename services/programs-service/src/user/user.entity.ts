import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { IsEmail, Validate } from 'class-validator';
import * as crypto from 'crypto';
import { ProgramEntity } from '../program/program.entity';
import { CriteriumEntity } from '../criterium/criterium.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  password: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  countryId: number;

  @BeforeInsert()
  hashPassword() {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

  @OneToMany(type => ProgramEntity, program => program.author)
  programs: ProgramEntity[];

  @OneToMany(type => CriteriumEntity, criterium => criterium.author)
  criteriums: CriteriumEntity[];
}
