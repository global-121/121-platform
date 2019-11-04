import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('twilio-message')
export class TwilioMessageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public accountSid: string;

  @Column()
  public body: string;

  @Column()
  public to: string;

  @Column()
  public from: string;

  @Column()
  public sid: string;

  @Column()
  public status: string;

  @Column({ type: 'timestamp' })
  dateCreated: Date;
}
