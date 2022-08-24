import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserPersonAffectedDto {
  @ApiProperty({ example: 'test-pa' })
  @IsNotEmpty()
  public readonly username: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(4)
  public readonly password: string;
}
