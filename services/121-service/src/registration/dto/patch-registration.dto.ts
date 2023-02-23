import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PatchRegistrationDto {
  @ApiProperty({ example: '10d169fd-8da4-4acc-88fb-e1139bbbde6c' })
  @IsString()
  @IsNotEmpty()
  public readonly id: string;
  @ApiProperty({ example: 'value' })
  @IsString()
  @IsOptional()
  public readonly key: string;
}
