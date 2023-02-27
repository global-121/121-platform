import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRegistrationDto {
  @ApiProperty({ example: '10d169fd-8da4-4acc-88fb-e1139bbbde6c' })
  @IsString()
  @IsNotEmpty()
  public readonly id: string;

  @ApiProperty({
    description: 'This can be any key and any value. ',
    example: 'value',
  })
  @IsString()
  @IsOptional()
  public readonly key: string;
}
