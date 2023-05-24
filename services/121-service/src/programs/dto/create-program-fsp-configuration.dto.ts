import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProgramFspConfigurationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  fspId: number;

  @ApiProperty({ example: 'username' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'test_account' })
  @IsNotEmpty()
  @IsString()
  value: string;
}
