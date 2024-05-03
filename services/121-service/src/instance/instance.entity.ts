import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { Base121Entity } from '../base.entity';

// TODO: enforce only 1 instance/record in the database
@Entity('instance')
export class InstanceEntity extends Base121Entity {
  @Column()
  @ApiProperty({ example: 'instance name' })
  public name: string;

  @Column('json')
  @ApiProperty({ example: { en: 'display name' } })
  public displayName: JSON;
}
