import { ProgramEntity } from './../../programs/program/program.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('credential')
export class CredentialEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public did: string;

  @ManyToOne(
    type => ProgramEntity,
    program => program.credentials,
  )
  public program: ProgramEntity;

  @Column() // Store credentials encrypted
  public credential: string;
}
