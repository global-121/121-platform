import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ nullable: true })
  public id: string;

  @Column({ nullable: true })
  public date: string;

  @Column({ nullable: true })
  public processdate: string;

  @Column({ nullable: true })
  public statuscomment: string;

  @Column()
  public status: string;

  @Column({ nullable: true })
  public referenceid: string;

  @Column({ nullable: true })
  public tracenumber: string;

  @Column()
  public system: string;
}
