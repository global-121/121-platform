import { Base121Entity } from '@121-service/src/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('imagecode')
export class ImageCodeEntity extends Base121Entity {
  @Column()
  public secret: string;

  @Column({ type: 'bytea' })
  public image: any;
}
