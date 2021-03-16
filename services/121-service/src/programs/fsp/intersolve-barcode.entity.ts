import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ImageCodeExportVouchersEntity } from '../../notifications/imagecode/image-code-export-vouchers.entity';

@Entity('intersolve_barcode')
export class IntersolveBarcodeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column({ nullable: true })
  public installment: number;

  @Column({ nullable: true })
  public whatsappPhoneNumber: string;

  @Column()
  public pin: string;

  @Column()
  public barcode: string;

  @Column({ nullable: true })
  public amount: number;

  @Column({ nullable: true })
  public send: boolean;

  @Column({ default: false })
  public balanceUsed: boolean;

  @OneToMany(
    type => ImageCodeExportVouchersEntity,
    image => image.barcode,
  )
  public image: ImageCodeExportVouchersEntity[];
}
