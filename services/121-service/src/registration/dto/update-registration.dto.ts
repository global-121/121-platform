import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRegistrationDto {
  @ApiProperty({
    description: 'ID of the updated entity',
    example: '10d169fd-8da4-4acc-88fb-e1139bbbde6c',
  })
  @IsString()
  @IsNotEmpty()
  public readonly id: string;

  @ApiProperty({
    description: `Also 'key' itself can be replaced by any key. Additional key-value pairs can also be added within the same object.`,
    example: 'value',
  })
  @IsString()
  @IsOptional()
  public readonly key: string;
}
