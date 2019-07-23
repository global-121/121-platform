import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('connection')
export class ConnectionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public did: string;

  @Column('numeric', { array: true, nullable: true })
  public programs: number[];

}
