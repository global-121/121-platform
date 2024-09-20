import { Column, Entity } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';

@Entity('imagecode')
export class ImageCodeEntity extends Base121Entity {
  @Column()
  public secret: string;

  @Column({ type: 'bytea' })
  public image: unknown;
}
