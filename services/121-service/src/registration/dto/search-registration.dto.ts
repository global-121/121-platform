import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchRegistrationDto {
  @ApiProperty({ example: '31600000000' })
  @IsString()
  @IsOptional()
  public readonly phoneNumber: string;
}
