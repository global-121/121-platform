import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchRegistrationDto {
  @ApiProperty({ example: '31600000000' })
  @IsString()
  @IsOptional()
  public readonly phoneNumber: string;
  @ApiProperty({ example: 'name' })
  @IsString()
  @IsOptional()
  public readonly name: string;
}
