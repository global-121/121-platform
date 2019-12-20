import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { IsEmail } from 'class-validator';
const crypto = require('crypto');
import { ProgramEntity } from '../programs/program/program.entity';
import { StandardCriteriumEntity } from '../programs/standard-criterium/standard-criterium.entity';
import { AvailabilityEntity } from '../schedule/appointment/availability.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public username: string;

  @Column()
  @IsEmail()
  public email: string;

  @Column({ select: false })
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

  @ManyToMany(type => ProgramEntity, program => program.aidworkers)
  public assignedProgram: ProgramEntity[];
}
