import { Base121Entity } from '@121-service/src/base.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

// TODO: enforce only 1 organization/record in the database
@Entity('organization')
export class OrganizationEntity extends Base121Entity {
  @Column()
  @ApiProperty({ example: 'organization name' })
  public name: string;

  @Column('json')
  @ApiProperty({ example: { en: 'display name' } })
  public displayName: LocalizedString;
}
