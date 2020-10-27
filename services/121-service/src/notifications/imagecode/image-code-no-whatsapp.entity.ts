import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('imagecode_no_whatsapp')
export class ImageCodeNoWhatsappEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'bytea' })
  public image: any;
}
