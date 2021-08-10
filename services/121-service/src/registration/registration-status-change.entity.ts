import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('registration_status_change')
export class RegistrationStatusChangeEntity {
  @PrimaryGeneratedColumn()
  public id: number;
}
