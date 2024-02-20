import { ApiProperty } from '@nestjs/swagger';
import { EventEnum } from '../enum/event.enum';

class AttributesDto {
  [key: string]: string;
}

export class GetEventDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;
  @ApiProperty({ example: EventEnum.registrationDataChange })
  public readonly type: EventEnum;
  @ApiProperty({ example: { id: 1, username: 'admin@example.org' } })
  public readonly user: { id: number; username: string };
  @ApiProperty({ example: new Date() })
  public readonly created: Date;
  @ApiProperty({ example: { exampleKey: 'exampleValue' } })
  public readonly attributes: AttributesDto;
}
