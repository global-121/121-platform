import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
  ManyToOne
} from 'typeorm';
import { IsEmail } from 'class-validator';
import * as crypto from 'crypto';
import { ProgramEntity } from '../program/program.entity';
import { StandardCriteriumEntity } from '../standard-criterium/standard-criterium.entity';
import { AvailabilityEntity } from '../appointment/availability.entity';

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

  @OneToMany(type => AvailabilityEntity, availability => availability.aidworker)
  public availability: AvailabilityEntity[];

  @OneToMany(type => StandardCriteriumEntity, criterium => criterium.author)
  public criteriums: StandardCriteriumEntity[];

  @ManyToOne(type => ProgramEntity, program => program.aidworkers)
  public assigned_program: ProgramEntity;
}
