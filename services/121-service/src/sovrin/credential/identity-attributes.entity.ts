import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('identity_attributes')
export class IdentityAttributesEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public did: string;

  @Column()
  public attributeId: number;

  @Column()
  public attribute: string;

  @Column()
  public answer: string;
}
