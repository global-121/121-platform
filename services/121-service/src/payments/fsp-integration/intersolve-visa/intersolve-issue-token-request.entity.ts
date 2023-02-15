import { Column, Entity, Index } from 'typeorm';
import { Base121Entity } from '../../../base.entity';

@Entity('intersolve_issue_token_request')
export class IntersolveIssueTokenRequestEntity extends Base121Entity {
  @Index()
  @Column()
  public reference: string;

  @Column({ nullable: true })
  public saleId: string;

  @Column({ nullable: true })
  public statusCode: number;
}
