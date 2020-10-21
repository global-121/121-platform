import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('imagecode')
export class ImageCodeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public secret: string;

  @Column({ type: 'bytea' })
  public image: any;
}
