import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import * as crypto from 'crypto';
import { ProgramEntity } from '../program/program.entity';
import { StandardCriteriumEntity } from '../standard-criterium/standard-criterium.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public username: string;

  @Column()
  @IsEmail()
  public email: string;

  @Column()
  public password: string;

  @Column()
  public role: string;

  @Column({ nullable: true })
  public status: string;

  @Column({ nullable: true })
  public countryId: number;

  @BeforeInsert()
  public hashPassword() {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

  @OneToMany(type => ProgramEntity, program => program.author)
  public programs: ProgramEntity[];

  @OneToMany(type => StandardCriteriumEntity, criterium => criterium.author)
  public criteriums: StandardCriteriumEntity[];
}
