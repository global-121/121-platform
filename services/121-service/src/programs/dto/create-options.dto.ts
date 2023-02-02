import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOptionsDto {
  @ApiProperty()
  @IsNumber()
  public readonly id: number;

  @ApiProperty()
  @IsString()
  public readonly option: string;

  @ApiProperty()
  @IsNotEmpty()
  public readonly label: JSON;
}
