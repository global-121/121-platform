import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserPersonAffectedDto {
  @ApiProperty({ example: 'test-pa' })
  @IsNotEmpty()
  public readonly username: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(4)
  public readonly password: string;
}
