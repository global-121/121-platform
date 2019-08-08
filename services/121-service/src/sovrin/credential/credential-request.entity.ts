import { ProgramEntity } from './../../programs/program/program.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('credential-request')
export class CredentialRequestEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public did: string;

  @ManyToOne(type => ProgramEntity, program => program.credentialRequests)
  public program: ProgramEntity;

  @Column('json', { default: null })
  public credentialRequest: JSON;
}
