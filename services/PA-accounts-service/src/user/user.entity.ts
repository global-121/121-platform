import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import * as crypto from 'crypto';
import { DataStorageEntity } from '../data-storage/data-storage.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public username: string;

  @Column()
  public password: string;

  @BeforeInsert()
  public hashPassword() {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

  @OneToMany(type => DataStorageEntity, data => data.user)
  public dataObjects: DataStorageEntity[];

}
