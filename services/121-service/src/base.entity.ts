import {
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class Base121Entity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index()
  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public updated: Date;
}
