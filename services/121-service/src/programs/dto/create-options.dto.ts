import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOptionsDto {
  @ApiProperty()
  @IsString()
  public readonly option: string;

  @ApiProperty()
  @IsNotEmpty()
  public readonly label: JSON;
}
