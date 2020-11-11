import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ImageCodeExportVouchersEntity } from '../../notifications/imagecode/image-code-export-vouchers.entity';

@Entity('intersolve_instruction')
export class IntersolveInstructionsEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column({ type: 'bytea' })
  public image: any;
}
