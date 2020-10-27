import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('intersolve_barcode')
export class IntersolveBarcodeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column({ nullable: true })
  public whatsappPhoneNumber: string;

  @Column()
  public pin: string;

  @Column()
  public barcode: string;

  @Column({ nullable: true })
  public send: boolean;

  @ManyToOne(
    type => ConnectionEntity,
    connection => connection.barcodes,
  )
  public connection: ConnectionEntity;
}
