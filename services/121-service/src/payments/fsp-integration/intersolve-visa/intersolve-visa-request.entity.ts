import { Column, Entity, Index } from 'typeorm';
import { Base121Entity } from '../../../base.entity';

@Entity('intersolve_visa_request')
export class IntersolveVisaRequestEntity extends Base121Entity {
  @Index()
  @Column()
  public reference: string;

  @Column({ nullable: true })
  public saleId: string;

  @Index()
  @Column({ nullable: true })
  public endpoint: string;

  @Column({ nullable: true })
  public statusCode: number;

  @Column('json', { nullable: true })
  public metadata: JSON;
}
