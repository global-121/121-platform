import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('data-storage')
export class DataStorageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public userId: number;

  @Column()
  public type: string;

  @Column()
  public data: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;


}
