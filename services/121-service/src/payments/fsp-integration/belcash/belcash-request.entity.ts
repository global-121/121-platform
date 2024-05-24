import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('belcash_request')
export class BelcashRequestEntity {
  @PrimaryGeneratedColumn()
  public belcashRequestId: number;

  @Column()
  public from: string;

  @Column()
  public fromname: string;

  @Column()
  public fromaccount: string;

  @Column()
  public to: string;

  @Column()
  public toname: string;

  @Column()
  public toaccount: string;

  @Column()
  public amount: number;

  @Column()
  public fee: number;

  @Column()
  public currency: string;

  @Column()
  public description: string;

  @Column()
  public statusdetail: string;

  @Column({ type: 'character varying', nullable: true })
  public id: string | null;

  @Column({ type: 'character varying', nullable: true })
  public date: string | null;

  @Column({ type: 'character varying', nullable: true })
  public processdate: string | null;

  @Column({ type: 'character varying', nullable: true })
  public statuscomment: string | null;

  @Column()
  public status: string;

  @Column({ type: 'character varying', nullable: true })
  public referenceid: string | null;

  @Column({ type: 'character varying', nullable: true })
  public tracenumber: string | null;

  @Column()
  public system: string;
}
