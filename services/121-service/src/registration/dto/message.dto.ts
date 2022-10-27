import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class MessageDto {
  @ApiProperty({ example: 'Rejection message' })
  @MinLength(20)
  @IsString()
  @IsOptional()
  public readonly message: string;
}
