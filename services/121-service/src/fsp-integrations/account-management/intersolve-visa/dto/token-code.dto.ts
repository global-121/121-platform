import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TokenCodeDto {
  @ApiProperty({ example: '1111222233334444555' })
  @IsNotEmpty()
  @IsString()
  @Length(19, 19, { message: 'tokenCode must be 19 characters long' })
  public readonly tokenCode: string;
}
