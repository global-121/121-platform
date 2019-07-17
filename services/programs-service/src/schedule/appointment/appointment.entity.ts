import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('appointment')
export class AppointmentEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public timeslotId: number;
}
