import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('intersolve_instruction')
export class IntersolveInstructionsEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column({ type: 'bytea' })
  public image: any;
}
