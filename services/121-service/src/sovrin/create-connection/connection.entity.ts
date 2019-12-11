import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('connection')
export class ConnectionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public did: string;

  @Column({ nullable: true })
  public phoneNumber: string;

  @Column({ nullable: true })
  public preferredLanguage: string;

  @Column({ nullable: true })
  public fspId: number;

  @Column('numeric', {
    array: true,
    default: () => 'array[]::integer[]',
    nullable: true,
  })
  public programsEnrolled: number[];

  @Column('numeric', {
    array: true,
    default: () => 'array[]::integer[]',
    nullable: true,
  })
  public programsIncluded: number[];

  @Column('numeric', {
    array: true,
    default: () => 'array[]::integer[]',
    nullable: true,
  })
  public programsExcluded: number[];

  @Column('json', {
    default: {}
  })
  public customData: JSON;
}
