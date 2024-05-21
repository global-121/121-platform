import { Base121Entity } from '@121-service/src/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedString } from 'src/shared/enum/language.enums';
import { Column, Entity } from 'typeorm';

// TODO: enforce only 1 instance/record in the database
@Entity('instance')
export class InstanceEntity extends Base121Entity {
  @Column()
  @ApiProperty({ example: 'instance name' })
  public name: string;

  @Column('json')
  @ApiProperty({ example: { en: 'display name' } })
  public displayName: LocalizedString;
}
