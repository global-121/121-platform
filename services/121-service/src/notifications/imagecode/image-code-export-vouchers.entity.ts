import { ConnectionEntity } from '../../connection/connection.entity';
import { IntersolveBarcodeEntity } from '../../programs/fsp/intersolve-barcode.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('imagecode_export_vouchers')
export class ImageCodeExportVouchersEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'bytea' })
  public image: any;

  @ManyToOne(
    type => ConnectionEntity,
    connection => connection.images,
  )
  public connection: ConnectionEntity;

  @ManyToOne(
    type => IntersolveBarcodeEntity,
    barcode => barcode.image,
  )
  public barcode: IntersolveBarcodeEntity;
}
