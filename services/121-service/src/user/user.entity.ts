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
import { ActionEntity } from '../actions/action.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @IsEmail()
  public email: string;

  @Column({ select: false })
  public password: string;

  @Column()
  public role: string;

  @Column({ nullable: true })
  public status: string;

  @BeforeInsert()
  public hashPassword(): any {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @OneToMany(
    type => ProgramEntity,
    program => program.author,
  )
  public programs: ProgramEntity[];

  @OneToMany(
    type => ActionEntity,
    program => program.user,
  )
  public actions: ActionEntity[];

  @ManyToMany(
    type => ProgramEntity,
    program => program.aidworkers,
  )
  public assignedProgram: ProgramEntity[];
}
