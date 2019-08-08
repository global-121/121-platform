import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('credential_attributes')
export class CredentialAttributesEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public did: string;

  @Column()
  public programId: number;

  @Column()
  public attributeId: number;

  @Column()
  public attribute: string;

  @Column()
  public answer: number;
}
