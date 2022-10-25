import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaDataTypes } from '../enum/padata-types.enum';

export class StoreDataDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly type: PaDataTypes;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly data: string;
}
