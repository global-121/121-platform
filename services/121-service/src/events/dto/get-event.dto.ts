import { ApiProperty } from '@nestjs/swagger';

import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { WrapperType } from '@121-service/src/wrapper.type';

class AttributesDto {
  [key: string]: string;
}

export class GetEventDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;
  @ApiProperty({ example: EventEnum.registrationDataChange })
  public readonly type: WrapperType<EventEnum>;
  @ApiProperty({ example: { id: 1, username: 'admin@example.org' } })
  public readonly user: { id: number; username: string } | null;
  @ApiProperty({ example: new Date() })
  public readonly created: Date;
  @ApiProperty({ example: { exampleKey: 'exampleValue' } })
  public readonly attributes: AttributesDto;
  @ApiProperty({ example: 1 })
  public readonly registrationId: number;
}
