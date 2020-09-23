import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('intersolve_barcode')
export class IntersolveBarcodeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column()
  public phonenumber: string;

  @Column()
  public pin: string;

  @Column()
  public barcode: string;

  @Column({ nullable: true })
  public send: boolean;
}
