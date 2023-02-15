import { Column, Entity, Index } from 'typeorm';
import { Base121Entity } from '../../../base.entity';

@Entity('intersolve_load_request')
export class IntersolveLoadRequestEntity extends Base121Entity {
  @Index()
  @Column()
  public reference: string;

  @Column({ nullable: true })
  public saleId: string;

  @Index()
  @Column({ nullable: true })
  public tokenCode: string;

  @Column()
  public quantityValue: number;

  @Column({ nullable: true })
  public statusCode: number;
}
