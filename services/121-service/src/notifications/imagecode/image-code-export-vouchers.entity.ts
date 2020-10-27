import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('imagecode_export_vouchers')
export class ImageCodeExportVouchers {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'bytea' })
  public image: any;

  @ManyToOne(
    type => ConnectionEntity,
    connection => connection.images,
  )
  public connection: ConnectionEntity;
}
